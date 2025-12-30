mod rect_iter;
mod triangle_iter;

use crate::algo::geom2::spatial_hash::coord::SpatialHashMapCoord;
use crate::algo::geom2::spatial_hash::insertable::SpatialHashMapSpec;
use nalgebra::Point2;

pub use rect_iter::RectCellIter;
pub use triangle_iter::TriangleCellIter;

#[derive(Debug, Clone)]
pub enum SpatialHashMapQuery<T>
where
    T: nalgebra::Scalar,
{
    IntersectsCircle {
        center: Point2<T>,
        radius: T,
    },
    IntersectsRectangle {
        corner_one: Point2<T>,
        corner_two: Point2<T>,
    },
    IntersectsTriangle {
        p0: Point2<T>,
        p1: Point2<T>,
        p2: Point2<T>,
    },
}

/// Cell iterator enum - variants for each query type
#[derive(Debug, Clone)]
pub enum QueryCellIter<C> {
    Rect(RectCellIter<C>),
    Triangle(TriangleCellIter<C>),
}

impl<C> SpatialHashMapQuery<C>
where
    C: SpatialHashMapCoord
        + nalgebra::Scalar
        + PartialOrd
        + std::ops::Add<Output = C>
        + std::ops::Sub<Output = C>
        + std::ops::Mul<Output = C>
        + std::ops::Div<Output = C>
        + From<u8>,
{
    /// Returns an iterator over cell coordinates (cx, cy) that this query intersects.
    pub fn get_query_cells(&self, spec: SpatialHashMapSpec<C>) -> QueryCellIter<C> {
        match self {
            SpatialHashMapQuery::IntersectsCircle { center, radius } => {
                let min_cx = if center.coords.x < *radius {
                    C::from(0u8)
                } else {
                    center.coords.x - *radius
                }
                .get_cell_index(spec.cell_width)
                .positive_or_zero();

                let max_cx = center
                    .coords
                    .x
                    .spatial_saturating_add(*radius)
                    .get_cell_index(spec.cell_width)
                    .positive_or_zero();

                let min_cy = if center.coords.y < *radius {
                    C::from(0u8)
                } else {
                    center.coords.y - *radius
                }
                .get_cell_index(spec.cell_height)
                .positive_or_zero();

                let max_cy = center
                    .coords
                    .y
                    .spatial_saturating_add(*radius)
                    .get_cell_index(spec.cell_height)
                    .positive_or_zero();

                QueryCellIter::Rect(RectCellIter::new(min_cx, max_cx, min_cy, max_cy))
            }
            SpatialHashMapQuery::IntersectsRectangle {
                corner_one: cornder_one,
                corner_two,
            } => {
                let (min_x, max_x) = if cornder_one.coords.x < corner_two.coords.x {
                    (cornder_one.coords.x, corner_two.coords.x)
                } else {
                    (corner_two.coords.x, cornder_one.coords.x)
                };
                let (min_y, max_y) = if cornder_one.coords.y < corner_two.coords.y {
                    (cornder_one.coords.y, corner_two.coords.y)
                } else {
                    (corner_two.coords.y, cornder_one.coords.y)
                };

                let min_cx = min_x.get_cell_index(spec.cell_width).positive_or_zero();
                let max_cx = max_x.get_cell_index(spec.cell_width).positive_or_zero();
                let min_cy = min_y.get_cell_index(spec.cell_height).positive_or_zero();
                let max_cy = max_y.get_cell_index(spec.cell_height).positive_or_zero();

                QueryCellIter::Rect(RectCellIter::new(min_cx, max_cx, min_cy, max_cy))
            }
            SpatialHashMapQuery::IntersectsTriangle { p0, p1, p2 } => {
                QueryCellIter::Triangle(TriangleCellIter::new(
                    (p0.coords.x, p0.coords.y),
                    (p1.coords.x, p1.coords.y),
                    (p2.coords.x, p2.coords.y),
                    spec.cell_width,
                    spec.cell_height,
                ))
            }
        }
    }
}

impl<C> Iterator for QueryCellIter<C>
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
        match self {
            QueryCellIter::Rect(iter) => iter.next(),
            QueryCellIter::Triangle(iter) => iter.next(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_rectangle_cells_basic() {
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(5i32, 5),
            corner_two: Point2::new(25, 25),
        };
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };

        let cells: Vec<(i32, i32)> = query.get_query_cells(spec).collect();
        let expected: HashSet<(i32, i32)> = [
            (0, 0),
            (1, 0),
            (2, 0),
            (0, 1),
            (1, 1),
            (2, 1),
            (0, 2),
            (1, 2),
            (2, 2),
        ]
        .iter()
        .copied()
        .collect();

        assert_eq!(cells.len(), expected.len());
        let cells_set: HashSet<(i32, i32)> = cells.into_iter().collect();
        assert_eq!(cells_set, expected);
    }

    #[test]
    fn test_rectangle_cells_single_cell() {
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(5i32, 5),
            corner_two: Point2::new(8, 8),
        };
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };

        let cells: Vec<(i32, i32)> = query.get_query_cells(spec).collect();
        assert_eq!(cells, vec![(0, 0)]);
    }

    #[test]
    fn test_circle_cells_basic() {
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(15i32, 15),
            radius: 5,
        };
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };

        let cells: Vec<(i32, i32)> = query.get_query_cells(spec).collect();
        let expected: HashSet<(i32, i32)> =
            [(1, 1), (2, 1), (1, 2), (2, 2)].iter().copied().collect();

        let cells_set: HashSet<(i32, i32)> = cells.into_iter().collect();
        assert_eq!(cells_set, expected);
    }

    #[test]
    fn test_triangle_cells_right_triangle() {
        // Right triangle with vertices at (0,0), (30,0), (0,30)
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0i32, 0),
            p1: Point2::new(30, 0),
            p2: Point2::new(0, 30),
        };
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };

        let cells: Vec<(i32, i32)> = query.get_query_cells(spec).collect();
        let cells_set: HashSet<(i32, i32)> = cells.into_iter().collect();

        // Row 0 (y=0-10): x should span 0-30, cells (0,0), (1,0), (2,0), (3,0)
        // Row 1 (y=10-20): x should span 0-20, cells (0,1), (1,1), (2,1)
        // Row 2 (y=20-30): x should span 0-10, cells (0,2), (1,2)
        // Row 3 (y=30): just the point (0,30), cell (0,3)
        let expected: HashSet<(i32, i32)> = [
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

        assert_eq!(cells_set, expected);
    }

    #[test]
    fn test_triangle_cells_single_cell() {
        // Small triangle entirely within one cell
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(2i32, 2),
            p1: Point2::new(5, 2),
            p2: Point2::new(3, 5),
        };
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };

        let cells: Vec<(i32, i32)> = query.get_query_cells(spec).collect();
        assert_eq!(cells, vec![(0, 0)]);
    }

    #[test]
    fn test_triangle_cells_horizontal_edge() {
        // Triangle with horizontal bottom edge
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0i32, 0),
            p1: Point2::new(20, 0),
            p2: Point2::new(10, 20),
        };
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };

        let cells: Vec<(i32, i32)> = query.get_query_cells(spec).collect();
        let cells_set: HashSet<(i32, i32)> = cells.into_iter().collect();

        // Should cover cells touched by the triangle
        assert!(cells_set.contains(&(0, 0)));
        assert!(cells_set.contains(&(1, 0)));
        assert!(cells_set.contains(&(2, 0)));
        assert!(cells_set.contains(&(1, 1)));
        assert!(cells_set.contains(&(1, 2)));
    }

    #[test]
    fn test_triangle_cells_f32() {
        // Test with floating point coordinates
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0.0f32, 0.0),
            p1: Point2::new(25.0, 0.0),
            p2: Point2::new(12.5, 25.0),
        };
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };

        let cells: Vec<(f32, f32)> = query.get_query_cells(spec).collect();
        let cells_set: HashSet<(i32, i32)> = cells
            .into_iter()
            .map(|(x, y)| (x as i32, y as i32))
            .collect();

        // Bottom row should have cells 0, 1, 2
        assert!(cells_set.contains(&(0, 0)));
        assert!(cells_set.contains(&(1, 0)));
        assert!(cells_set.contains(&(2, 0)));
    }

    /// Table-based tests for triangle queries
    #[test]
    fn test_triangle_cells_table() {
        struct TestCase {
            name: &'static str,
            p0: (i32, i32),
            p1: (i32, i32),
            p2: (i32, i32),
            cell_size: (i32, i32),
            expected: &'static [(i32, i32)],
        }

        let test_cases = [
            TestCase {
                name: "degenerate_point",
                p0: (5, 5),
                p1: (5, 5),
                p2: (5, 5),
                cell_size: (10, 10),
                expected: &[(0, 0)],
            },
            TestCase {
                name: "degenerate_horizontal_line",
                p0: (0, 5),
                p1: (25, 5),
                p2: (10, 5),
                cell_size: (10, 10),
                expected: &[(0, 0), (1, 0), (2, 0)],
            },
            TestCase {
                name: "degenerate_vertical_line",
                p0: (5, 0),
                p1: (5, 25),
                p2: (5, 10),
                cell_size: (10, 10),
                expected: &[(0, 0), (0, 1), (0, 2)],
            },
            TestCase {
                name: "thin_diagonal_triangle",
                p0: (0, 0),
                p1: (30, 30),
                p2: (1, 1),
                cell_size: (10, 10),
                expected: &[(0, 0), (1, 0), (1, 1), (2, 1), (2, 2), (3, 2), (3, 3)],
            },
            TestCase {
                name: "equilateral_like",
                p0: (10, 0),
                p1: (20, 0),
                p2: (15, 17),
                cell_size: (10, 10),
                expected: &[(1, 0), (2, 0), (1, 1)],
            },
            TestCase {
                name: "inverted_triangle",
                p0: (0, 30),
                p1: (30, 30),
                p2: (15, 0),
                cell_size: (10, 10),
                expected: &[
                    (1, 0),
                    (2, 0),
                    (0, 1),
                    (1, 1),
                    (2, 1),
                    (3, 2),
                    (0, 2),
                    (1, 2),
                    (2, 2),
                    (0, 3),
                    (1, 3),
                    (2, 3),
                    (3, 3),
                ],
            },
            TestCase {
                name: "offset_small_triangle",
                p0: (45, 45),
                p1: (55, 45),
                p2: (50, 55),
                cell_size: (10, 10),
                expected: &[(4, 4), (5, 4), (4, 5), (5, 5)],
            },
            TestCase {
                name: "spans_cell_boundary_exactly",
                p0: (0, 0),
                p1: (10, 0),
                p2: (5, 10),
                cell_size: (10, 10),
                expected: &[(0, 0), (1, 0), (0, 1)],
            },
            TestCase {
                name: "clockwise_winding",
                p0: (0, 0),
                p1: (0, 20),
                p2: (20, 0),
                cell_size: (10, 10),
                expected: &[(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (0, 2)],
            },
            TestCase {
                name: "counterclockwise_winding",
                p0: (0, 0),
                p1: (20, 0),
                p2: (0, 20),
                cell_size: (10, 10),
                expected: &[(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (0, 2)],
            },
            TestCase {
                name: "non_square_cells",
                p0: (0, 0),
                p1: (30, 0),
                p2: (15, 20),
                cell_size: (15, 10),
                expected: &[(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (1, 2)],
            },
        ];

        for tc in test_cases {
            let query = SpatialHashMapQuery::IntersectsTriangle {
                p0: Point2::new(tc.p0.0, tc.p0.1),
                p1: Point2::new(tc.p1.0, tc.p1.1),
                p2: Point2::new(tc.p2.0, tc.p2.1),
            };
            let spec = SpatialHashMapSpec {
                cell_width: tc.cell_size.0,
                cell_height: tc.cell_size.1,
            };

            let cells: Vec<(i32, i32)> = query.get_query_cells(spec).collect();
            let cells_set: HashSet<(i32, i32)> = cells.into_iter().collect();
            let expected_set: HashSet<(i32, i32)> = tc.expected.iter().copied().collect();

            assert_eq!(
                cells_set, expected_set,
                "Test case '{}' failed.\nExpected: {:?}\nGot: {:?}",
                tc.name, expected_set, cells_set
            );
        }
    }
}
