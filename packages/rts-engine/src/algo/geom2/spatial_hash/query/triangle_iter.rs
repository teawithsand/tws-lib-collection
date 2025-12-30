use crate::algo::geom2::spatial_hash::coord::SpatialHashMapCoord;

/// Iterator state for triangle scanline cell iteration
/// Stores vertices as raw coordinates to avoid nalgebra::Scalar bound on struct
#[derive(Debug, Clone)]
pub struct TriangleCellIter<C> {
    /// Triangle vertices sorted by y coordinate (v0.y <= v1.y <= v2.y)
    v0_x: C,
    v0_y: C,
    v1_x: C,
    v1_y: C,
    v2_x: C,
    v2_y: C,
    /// Cell dimensions
    cell_width: C,
    cell_height: C,
    /// Current row and column in cell coordinates
    current_cy: C,
    max_cy: C,
    /// Current x range for this row
    current_cx: C,
    row_max_cx: C,
    /// Whether iteration is complete
    done: bool,
}

impl<C> TriangleCellIter<C>
where
    C: SpatialHashMapCoord
        + PartialOrd
        + Copy
        + std::ops::Add<Output = C>
        + std::ops::Sub<Output = C>
        + std::ops::Mul<Output = C>
        + std::ops::Div<Output = C>
        + From<u8>,
{
    /// Create a new triangle cell iterator from three vertices
    pub fn new(p0: (C, C), p1: (C, C), p2: (C, C), cell_width: C, cell_height: C) -> Self {
        // Sort vertices by y coordinate
        let ((v0_x, v0_y), (v1_x, v1_y), (v2_x, v2_y)) = sort_vertices_by_y(p0, p1, p2);

        let min_cy = v0_y.get_cell_index(cell_height).positive_or_zero();
        let max_cy = v2_y.get_cell_index(cell_height).positive_or_zero();

        let mut iter = Self {
            v0_x,
            v0_y,
            v1_x,
            v1_y,
            v2_x,
            v2_y,
            cell_width,
            cell_height,
            current_cy: min_cy,
            max_cy,
            current_cx: C::from(0u8),
            row_max_cx: C::from(0u8),
            done: false,
        };

        // Initialize the first row's x range
        iter.compute_row_x_range();
        iter
    }

    /// Compute the x range for the current row using scanline intersection
    fn compute_row_x_range(&mut self) {
        if self.done {
            return;
        }

        // Get the y range for this cell row
        let row_y_min = self.current_cy * self.cell_height;
        let row_y_max = (self.current_cy + C::from(1u8)) * self.cell_height;

        // Find x intersections of the triangle edges with this row
        let mut x_values: [Option<C>; 6] = [None; 6];
        let mut count = 0;

        // Check all three edges: v0-v1, v1-v2, v0-v2
        let edges = [
            ((self.v0_x, self.v0_y), (self.v1_x, self.v1_y)),
            ((self.v1_x, self.v1_y), (self.v2_x, self.v2_y)),
            ((self.v0_x, self.v0_y), (self.v2_x, self.v2_y)),
        ];

        for ((ax, ay), (bx, by)) in edges {
            // Check if edge intersects or overlaps this row's y range
            let (y_lo, y_hi) = if ay < by { (ay, by) } else { (by, ay) };

            // Edge must overlap with row [row_y_min, row_y_max]
            if y_hi < row_y_min || y_lo > row_y_max {
                continue;
            }

            // Compute x at row_y_min and row_y_max intersections
            if ay == by {
                // Horizontal edge - add both x endpoints if in this row
                if ay >= row_y_min && ay <= row_y_max {
                    if count < 6 {
                        x_values[count] = Some(ax);
                        count += 1;
                    }
                    if count < 6 {
                        x_values[count] = Some(bx);
                        count += 1;
                    }
                }
            } else {
                // Non-horizontal edge - interpolate x at row boundaries
                let dy = by - ay;
                let dx = bx - ax;

                // Clamp y values to edge range
                let y1 = if row_y_min > y_lo { row_y_min } else { y_lo };
                let y2 = if row_y_max < y_hi { row_y_max } else { y_hi };

                // x = a.x + (y - a.y) * dx / dy
                if count < 6 {
                    let x1 = ax + (y1 - ay) * dx / dy;
                    x_values[count] = Some(x1);
                    count += 1;
                }
                if count < 6 && y1 != y2 {
                    let x2 = ax + (y2 - ay) * dx / dy;
                    x_values[count] = Some(x2);
                    count += 1;
                }
            }
        }

        if count == 0 {
            // No intersections - skip to next row
            self.current_cy = self.current_cy + C::from(1u8);
            if self.current_cy > self.max_cy {
                self.done = true;
            } else {
                self.compute_row_x_range();
            }
            return;
        }

        // Find min and max x from all intersection points
        let mut min_x = x_values[0].unwrap();
        let mut max_x = min_x;
        for i in 1..count {
            if let Some(x) = x_values[i] {
                if x < min_x {
                    min_x = x;
                }
                if x > max_x {
                    max_x = x;
                }
            }
        }

        self.current_cx = min_x.get_cell_index(self.cell_width).positive_or_zero();
        self.row_max_cx = max_x.get_cell_index(self.cell_width).positive_or_zero();
    }

    /// Advance to the next row
    fn advance_row(&mut self) {
        self.current_cy = self.current_cy + C::from(1u8);
        if self.current_cy > self.max_cy {
            self.done = true;
        } else {
            self.compute_row_x_range();
        }
    }
}

/// Sort three points by y coordinate (ascending), with x as tiebreaker
fn sort_vertices_by_y<C>(p0: (C, C), p1: (C, C), p2: (C, C)) -> ((C, C), (C, C), (C, C))
where
    C: PartialOrd + Copy,
{
    let mut pts = [p0, p1, p2];
    // Simple bubble sort for 3 elements
    if pts[0].1 > pts[1].1 || (pts[0].1 == pts[1].1 && pts[0].0 > pts[1].0) {
        pts.swap(0, 1);
    }
    if pts[1].1 > pts[2].1 || (pts[1].1 == pts[2].1 && pts[1].0 > pts[2].0) {
        pts.swap(1, 2);
    }
    if pts[0].1 > pts[1].1 || (pts[0].1 == pts[1].1 && pts[0].0 > pts[1].0) {
        pts.swap(0, 1);
    }
    (pts[0], pts[1], pts[2])
}

impl<C> Iterator for TriangleCellIter<C>
where
    C: SpatialHashMapCoord
        + PartialOrd
        + Copy
        + std::ops::Add<Output = C>
        + std::ops::Sub<Output = C>
        + std::ops::Mul<Output = C>
        + std::ops::Div<Output = C>
        + From<u8>,
{
    type Item = (C, C);

    fn next(&mut self) -> Option<Self::Item> {
        if self.done {
            return None;
        }

        let result = (self.current_cx, self.current_cy);

        // Advance to next cell in row
        self.current_cx = self.current_cx + C::from(1u8);
        if self.current_cx > self.row_max_cx {
            self.advance_row();
        }

        Some(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_triangle_iter_single_cell() {
        let iter = TriangleCellIter::new((2i32, 2), (5, 2), (3, 5), 10, 10);
        let cells: Vec<_> = iter.collect();
        assert_eq!(cells, vec![(0, 0)]);
    }

    #[test]
    fn test_triangle_iter_right_triangle() {
        let iter = TriangleCellIter::new((0i32, 0), (30, 0), (0, 30), 10, 10);
        let cells: HashSet<_> = iter.collect();

        let expected: HashSet<_> = [
            (0, 0),
            (1, 0),
            (2, 0),
            (3, 0),
            (0, 1),
            (1, 1),
            (2, 1),
            (0, 2),
            (1, 2),
            (0, 3),
        ]
        .iter()
        .copied()
        .collect();

        assert_eq!(cells, expected);
    }

    #[test]
    fn test_triangle_iter_upside_down() {
        // Triangle pointing down: apex at bottom
        let iter = TriangleCellIter::new((0i32, 0), (20, 0), (10, 20), 10, 10);
        let cells: HashSet<_> = iter.collect();

        // Should cover the triangle area
        assert!(cells.contains(&(0, 0)));
        assert!(cells.contains(&(1, 0)));
        assert!(cells.contains(&(2, 0)));
        assert!(cells.contains(&(1, 1)));
        assert!(cells.contains(&(1, 2)));
    }

    #[test]
    fn test_sort_vertices_by_y() {
        // Already sorted
        assert_eq!(
            sort_vertices_by_y((0, 0), (1, 1), (2, 2)),
            ((0, 0), (1, 1), (2, 2))
        );

        // Reverse order
        assert_eq!(
            sort_vertices_by_y((2, 2), (1, 1), (0, 0)),
            ((0, 0), (1, 1), (2, 2))
        );

        // Same y, sort by x
        assert_eq!(
            sort_vertices_by_y((2, 0), (0, 0), (1, 1)),
            ((0, 0), (2, 0), (1, 1))
        );
    }
}
