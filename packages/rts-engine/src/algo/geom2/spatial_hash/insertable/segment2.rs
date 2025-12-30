use super::super::SpatialHashMapCoord;
use super::{Aabb, SpatialHashMapShape, SpatialHashMapSpec};
use crate::algo::geom2::spatial_hash::query::SpatialHashMapQuery;
use crate::algo::geom2::Segment2;
use nalgebra::Point2;

fn min_max<C: PartialOrd + Clone>(a: C, b: C) -> (C, C) {
    if a < b {
        (a, b)
    } else {
        (b, a)
    }
}

fn point_in_rect<C: PartialOrd>(
    px: &C,
    py: &C,
    min_x: &C,
    max_x: &C,
    min_y: &C,
    max_y: &C,
) -> bool {
    px >= min_x && px <= max_x && py >= min_y && py <= max_y
}

fn point_in_triangle<C>(px: &C, py: &C, p0: &Point2<C>, p1: &Point2<C>, p2: &Point2<C>) -> bool
where
    C: nalgebra::Scalar + PartialOrd + std::ops::Sub<Output = C> + std::ops::Mul<Output = C>,
{
    let zero = px.clone() - px.clone();

    let sign0 = (px.clone() - p2.coords.x.clone()) * (p0.coords.y.clone() - p2.coords.y.clone())
        - (p0.coords.x.clone() - p2.coords.x.clone()) * (py.clone() - p2.coords.y.clone());
    let sign1 = (px.clone() - p0.coords.x.clone()) * (p1.coords.y.clone() - p0.coords.y.clone())
        - (p1.coords.x.clone() - p0.coords.x.clone()) * (py.clone() - p0.coords.y.clone());
    let sign2 = (px.clone() - p1.coords.x.clone()) * (p2.coords.y.clone() - p1.coords.y.clone())
        - (p2.coords.x.clone() - p1.coords.x.clone()) * (py.clone() - p1.coords.y.clone());

    let has_neg = sign0 < zero || sign1 < zero || sign2 < zero;
    let has_pos = sign0 > zero || sign1 > zero || sign2 > zero;

    // For degenerate triangles (all signs zero), this would incorrectly return true.
    // A degenerate triangle has zero area, meaning all 3 points are collinear.
    // In this case, we should return false unless the point is on one of the edges
    // (which is handled separately by segments_intersect in the caller).
    if !has_neg && !has_pos {
        // All signs are zero - degenerate triangle or point exactly on edge
        // For truly degenerate triangles (collinear vertices), reject
        // Check if triangle has zero area by computing cross product of two edges
        let edge1_x = p1.coords.x.clone() - p0.coords.x.clone();
        let edge1_y = p1.coords.y.clone() - p0.coords.y.clone();
        let edge2_x = p2.coords.x.clone() - p0.coords.x.clone();
        let edge2_y = p2.coords.y.clone() - p0.coords.y.clone();
        let twice_area = edge1_x * edge2_y - edge1_y * edge2_x;
        if twice_area == zero {
            // Degenerate triangle - don't claim point is "inside"
            return false;
        }
    }

    !(has_neg && has_pos)
}

fn cross_product_sign<C>(a: &Point2<C>, b: &Point2<C>, c: &Point2<C>) -> std::cmp::Ordering
where
    C: nalgebra::Scalar + PartialOrd + std::ops::Sub<Output = C> + std::ops::Mul<Output = C>,
{
    let dx1 = b.coords.x.clone() - a.coords.x.clone();
    let dy1 = b.coords.y.clone() - a.coords.y.clone();
    let dx2 = c.coords.x.clone() - a.coords.x.clone();
    let dy2 = c.coords.y.clone() - a.coords.y.clone();

    let cross = dx1 * dy2.clone() - dy1 * dx2.clone();
    let zero = dy2.clone() - dy2;

    if cross > zero {
        std::cmp::Ordering::Greater
    } else if cross < zero {
        std::cmp::Ordering::Less
    } else {
        std::cmp::Ordering::Equal
    }
}

fn on_segment<C>(a: &Point2<C>, b: &Point2<C>, c: &Point2<C>) -> bool
where
    C: nalgebra::Scalar + PartialOrd,
{
    let (min_x, max_x) = if a.coords.x < b.coords.x {
        (&a.coords.x, &b.coords.x)
    } else {
        (&b.coords.x, &a.coords.x)
    };
    let (min_y, max_y) = if a.coords.y < b.coords.y {
        (&a.coords.y, &b.coords.y)
    } else {
        (&b.coords.y, &a.coords.y)
    };
    c.coords.x >= *min_x && c.coords.x <= *max_x && c.coords.y >= *min_y && c.coords.y <= *max_y
}

fn segments_intersect<C>(p1: &Point2<C>, p2: &Point2<C>, p3: &Point2<C>, p4: &Point2<C>) -> bool
where
    C: nalgebra::Scalar + PartialOrd + std::ops::Sub<Output = C> + std::ops::Mul<Output = C>,
{
    let d1 = cross_product_sign(p3, p4, p1);
    let d2 = cross_product_sign(p3, p4, p2);
    let d3 = cross_product_sign(p1, p2, p3);
    let d4 = cross_product_sign(p1, p2, p4);

    use std::cmp::Ordering::*;
    match (d1, d2, d3, d4) {
        (Less, Greater, Less, Greater)
        | (Greater, Less, Greater, Less)
        | (Less, Greater, Greater, Less)
        | (Greater, Less, Less, Greater) => true,
        (Equal, Equal, _, _) => {
            on_segment(p3, p4, p1)
                || on_segment(p3, p4, p2)
                || on_segment(p1, p2, p3)
                || on_segment(p1, p2, p4)
        }
        (Equal, _, _, _) if d3 == Equal || d4 == Equal => on_segment(p3, p4, p1),
        (_, Equal, _, _) if d3 == Equal || d4 == Equal => on_segment(p3, p4, p2),
        (_, _, Equal, _) if d1 == Equal || d2 == Equal => on_segment(p1, p2, p3),
        (_, _, _, Equal) if d1 == Equal || d2 == Equal => on_segment(p1, p2, p4),
        (Equal, _, _, _) | (_, Equal, _, _) => d3 != d4,
        (_, _, Equal, _) | (_, _, _, Equal) => d1 != d2,
        _ => false,
    }
}

fn segment_intersects_circle<C>(
    start: &Point2<C>,
    end: &Point2<C>,
    center: &Point2<C>,
    radius: &C,
) -> bool
where
    C: nalgebra::Scalar
        + PartialOrd
        + std::ops::Add<Output = C>
        + std::ops::Sub<Output = C>
        + std::ops::Mul<Output = C>
        + std::ops::Div<Output = C>
        + From<u8>,
{
    let dx = end.coords.x.clone() - start.coords.x.clone();
    let dy = end.coords.y.clone() - start.coords.y.clone();
    let fx = center.coords.x.clone() - start.coords.x.clone();
    let fy = center.coords.y.clone() - start.coords.y.clone();

    let dot_fd = fx.clone() * dx.clone() + fy.clone() * dy.clone();
    let dot_dd = dx.clone() * dx.clone() + dy.clone() * dy.clone();
    let radius_sq = radius.clone() * radius.clone();

    if dot_dd == C::from(0u8) {
        let dist_sq = fx.clone() * fx + fy.clone() * fy;
        return dist_sq <= radius_sq;
    }

    let t_num = if dot_fd < C::from(0u8) {
        C::from(0u8)
    } else if dot_fd > dot_dd {
        dot_dd.clone()
    } else {
        dot_fd
    };

    let closest_x = start.coords.x.clone() + (t_num.clone() * dx) / dot_dd.clone();
    let closest_y = start.coords.y.clone() + (t_num * dy) / dot_dd;

    let dist_x = closest_x - center.coords.x.clone();
    let dist_y = closest_y - center.coords.y.clone();
    let dist_sq = dist_x.clone() * dist_x + dist_y.clone() * dist_y;

    dist_sq <= radius_sq
}

impl<C> SpatialHashMapShape<C> for Segment2<C>
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
    #[inline]
    fn get_intersecting_cells(
        &self,
        map_spec: SpatialHashMapSpec<C>,
    ) -> impl Iterator<Item = (C, C)> {
        let start = self.start();
        let end = self.end();

        let min_cell_x = start.coords.x.get_cell_index(map_spec.cell_width);
        let max_cell_x = end.coords.x.get_cell_index(map_spec.cell_width);
        let (min_y, max_y) = min_max(start.coords.y, end.coords.y);
        let min_cell_y = min_y.get_cell_index(map_spec.cell_height);
        let max_cell_y = max_y.get_cell_index(map_spec.cell_height);

        std::iter::successors(Some(min_cell_x), move |&cx| {
            if cx < max_cell_x {
                Some(cx.clone() + C::from(1u8))
            } else {
                None
            }
        })
        .flat_map(move |cx| {
            std::iter::successors(Some(min_cell_y), move |&cy| {
                if cy < max_cell_y {
                    Some(cy.clone() + C::from(1u8))
                } else {
                    None
                }
            })
            .map(move |cy| (cx, cy))
        })
    }

    fn matches_query(&self, query: &SpatialHashMapQuery<C>) -> bool {
        let start = self.start();
        let end = self.end();

        match query {
            SpatialHashMapQuery::IntersectsCircle { center, radius } => {
                segment_intersects_circle(&start, &end, center, radius)
            }
            SpatialHashMapQuery::IntersectsRectangle {
                corner_one: cornder_one,
                corner_two,
            } => {
                let (rect_min_x, rect_max_x) =
                    min_max(cornder_one.coords.x.clone(), corner_two.coords.x.clone());
                let (rect_min_y, rect_max_y) =
                    min_max(cornder_one.coords.y.clone(), corner_two.coords.y.clone());

                if point_in_rect(
                    &start.coords.x,
                    &start.coords.y,
                    &rect_min_x,
                    &rect_max_x,
                    &rect_min_y,
                    &rect_max_y,
                ) || point_in_rect(
                    &end.coords.x,
                    &end.coords.y,
                    &rect_min_x,
                    &rect_max_x,
                    &rect_min_y,
                    &rect_max_y,
                ) {
                    return true;
                }

                let tl = Point2::new(rect_min_x.clone(), rect_min_y.clone());
                let tr = Point2::new(rect_max_x.clone(), rect_min_y.clone());
                let bl = Point2::new(rect_min_x, rect_max_y.clone());
                let br = Point2::new(rect_max_x, rect_max_y);

                segments_intersect(&start, &end, &tl, &tr)
                    || segments_intersect(&start, &end, &tr, &br)
                    || segments_intersect(&start, &end, &br, &bl)
                    || segments_intersect(&start, &end, &bl, &tl)
            }
            SpatialHashMapQuery::IntersectsTriangle { p0, p1, p2 } => {
                if point_in_triangle(&start.coords.x, &start.coords.y, p0, p1, p2)
                    || point_in_triangle(&end.coords.x, &end.coords.y, p0, p1, p2)
                {
                    return true;
                }

                segments_intersect(&start, &end, p0, p1)
                    || segments_intersect(&start, &end, p1, p2)
                    || segments_intersect(&start, &end, p2, p0)
            }
        }
    }

    fn aabb(&self) -> Aabb<C> {
        let start = self.start();
        let end = self.end();
        let (min_x, max_x) = min_max(start.coords.x, end.coords.x);
        let (min_y, max_y) = min_max(start.coords.y, end.coords.y);
        Aabb {
            min: Point2::new(min_x, min_y),
            max: Point2::new(max_x, max_y),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use nalgebra::Point2;

    #[test]
    fn test_segment2_single_cell() {
        let seg = Segment2::new(Point2::new(5i32, 5i32), Point2::new(8i32, 8i32));
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };
        let cells: Vec<(i32, i32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0, 0)]);
    }

    #[test]
    fn test_segment2_horizontal() {
        let seg = Segment2::new(Point2::new(5i32, 5i32), Point2::new(25i32, 5i32));
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };
        let cells: Vec<(i32, i32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0, 0), (1, 0), (2, 0)]);
    }

    #[test]
    fn test_segment2_vertical() {
        let seg = Segment2::new(Point2::new(5i32, 5i32), Point2::new(5i32, 25i32));
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };
        let cells: Vec<(i32, i32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0, 0), (0, 1), (0, 2)]);
    }

    #[test]
    fn test_segment2_diagonal() {
        let seg = Segment2::new(Point2::new(5i32, 5i32), Point2::new(25i32, 25i32));
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };
        let cells: Vec<(i32, i32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(
            cells,
            vec![
                (0, 0),
                (0, 1),
                (0, 2),
                (1, 0),
                (1, 1),
                (1, 2),
                (2, 0),
                (2, 1),
                (2, 2),
            ]
        );
    }

    #[test]
    fn test_segment2_at_cell_boundary_inclusive() {
        // Point at x=10 should be in cell 1, not cell 0
        // [0,10) is cell 0, [10,20) is cell 1
        let seg = Segment2::new(Point2::new(10i32, 5i32), Point2::new(15i32, 5i32));
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };
        let cells: Vec<(i32, i32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(1, 0)]);
    }

    #[test]
    fn test_segment2_crossing_boundary() {
        // Segment from cell 0 to cell 1
        let seg = Segment2::new(Point2::new(5i32, 5i32), Point2::new(15i32, 5i32));
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };
        let cells: Vec<(i32, i32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0, 0), (1, 0)]);
    }

    #[test]
    fn test_segment2_exactly_at_boundary() {
        // Segment exactly at boundary: both endpoints on cell boundaries
        let seg = Segment2::new(Point2::new(10i32, 10i32), Point2::new(20i32, 20i32));
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };
        let cells: Vec<(i32, i32)> = seg.get_intersecting_cells(spec).collect();
        // x=10 is in cell 1, x=20 is in cell 2
        // y=10 is in cell 1, y=20 is in cell 2
        assert_eq!(cells, vec![(1, 1), (1, 2), (2, 1), (2, 2)]);
    }

    #[test]
    fn test_segment2_matches_circle_intersecting() {
        let seg = Segment2::new(Point2::new(0i32, 0i32), Point2::new(10, 0));
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(5, 5),
            radius: 6,
        };
        assert!(
            seg.matches_query(&query),
            "Segment should intersect circle when closest point is within radius"
        );
    }

    #[test]
    fn test_segment2_matches_circle_not_intersecting() {
        let seg = Segment2::new(Point2::new(0i32, 0i32), Point2::new(10, 0));
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(5, 10),
            radius: 5,
        };
        assert!(
            !seg.matches_query(&query),
            "Segment should not intersect circle when too far"
        );
    }

    #[test]
    fn test_segment2_matches_circle_endpoint_inside() {
        let seg = Segment2::new(Point2::new(0i32, 0i32), Point2::new(10, 0));
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(0, 0),
            radius: 5,
        };
        assert!(
            seg.matches_query(&query),
            "Segment with endpoint inside circle should match"
        );
    }

    #[test]
    fn test_segment2_matches_circle_touching_edge() {
        let seg = Segment2::new(Point2::new(0i32, 5i32), Point2::new(10, 5));
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(5, 0),
            radius: 5,
        };
        assert!(
            seg.matches_query(&query),
            "Segment touching circle edge should match"
        );
    }

    #[test]
    fn test_segment2_matches_circle_passes_through() {
        let seg = Segment2::new(Point2::new(0i32, 0i32), Point2::new(10, 10));
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(5, 5),
            radius: 3,
        };
        assert!(
            seg.matches_query(&query),
            "Segment passing through circle should match"
        );
    }

    #[test]
    fn test_segment2_matches_rectangle_fully_inside() {
        let seg = Segment2::new(Point2::new(2i32, 2i32), Point2::new(8, 8));
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment fully inside rectangle should match"
        );
    }

    #[test]
    fn test_segment2_matches_rectangle_crosses_boundary() {
        let seg = Segment2::new(Point2::new(-5i32, 5i32), Point2::new(15, 5));
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment crossing rectangle should match"
        );
    }

    #[test]
    fn test_segment2_matches_rectangle_one_endpoint_inside() {
        let seg = Segment2::new(Point2::new(5i32, 5i32), Point2::new(15, 15));
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment with one endpoint inside should match"
        );
    }

    #[test]
    fn test_segment2_matches_rectangle_on_edge() {
        let seg = Segment2::new(Point2::new(0i32, 5i32), Point2::new(0, 8));
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment on rectangle edge should match"
        );
    }

    #[test]
    fn test_segment2_matches_rectangle_outside_no_intersection() {
        let seg = Segment2::new(Point2::new(20i32, 20i32), Point2::new(30, 30));
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            !seg.matches_query(&query),
            "Segment completely outside rectangle should not match"
        );
    }

    #[test]
    fn test_segment2_matches_rectangle_diagonal_intersection() {
        let seg = Segment2::new(Point2::new(-5i32, -5i32), Point2::new(15, 15));
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment intersecting rectangle diagonally should match"
        );
    }

    #[test]
    fn test_segment2_matches_rectangle_corner_touch() {
        let seg = Segment2::new(Point2::new(-5i32, 10i32), Point2::new(5, 10));
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment touching rectangle corner should match"
        );
    }

    #[test]
    fn test_segment2_f32_basic() {
        let seg = Segment2::new(Point2::new(5.5f32, 5.5f32), Point2::new(8.2f32, 8.8f32));
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f32, f32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0.0, 0.0)]);
    }

    #[test]
    fn test_segment2_f32_crossing_cells() {
        let seg = Segment2::new(Point2::new(5.5f32, 5.5f32), Point2::new(25.2f32, 5.8f32));
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f32, f32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0.0, 0.0), (1.0, 0.0), (2.0, 0.0)]);
    }

    #[test]
    fn test_segment2_f32_vertical() {
        let seg = Segment2::new(Point2::new(5.5f32, 5.5f32), Point2::new(5.5f32, 25.5f32));
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f32, f32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0.0, 0.0), (0.0, 1.0), (0.0, 2.0)]);
    }

    #[test]
    fn test_segment2_f32_negative() {
        let seg = Segment2::new(Point2::new(-5.5f32, -5.5f32), Point2::new(-2.2f32, -2.2f32));
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f32, f32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(-1.0, -1.0)]);
    }

    #[test]
    fn test_segment2_f32_boundary_crossing() {
        let seg = Segment2::new(Point2::new(9.9f32, 9.9f32), Point2::new(10.1f32, 10.1f32));
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f32, f32)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0)]);
    }

    #[test]
    fn test_segment2_f32_matches_circle() {
        let seg = Segment2::new(Point2::new(0.0f32, 0.0f32), Point2::new(10.0, 0.0));
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(5.0, 5.0),
            radius: 6.0,
        };
        assert!(
            seg.matches_query(&query),
            "Float segment should intersect circle"
        );
    }

    #[test]
    fn test_segment2_f32_matches_rectangle() {
        let seg = Segment2::new(Point2::new(-5.5f32, 5.0f32), Point2::new(15.5, 5.0));
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0.0, 0.0),
            corner_two: Point2::new(10.0, 10.0),
        };
        assert!(
            seg.matches_query(&query),
            "Float segment crossing rectangle should match"
        );
    }

    #[test]
    fn test_segment2_f64_basic() {
        let seg = Segment2::new(Point2::new(5.5f64, 5.5f64), Point2::new(25.2f64, 5.8f64));
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f64, f64)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0.0, 0.0), (1.0, 0.0), (2.0, 0.0)]);
    }

    #[test]
    fn test_segment2_f64_boundary_behavior() {
        let seg = Segment2::new(Point2::new(0.0f64, 0.0f64), Point2::new(20.0f64, 20.0f64));
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f64, f64)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(
            cells,
            vec![
                (0.0, 0.0),
                (0.0, 1.0),
                (0.0, 2.0),
                (1.0, 0.0),
                (1.0, 1.0),
                (1.0, 2.0),
                (2.0, 0.0),
                (2.0, 1.0),
                (2.0, 2.0)
            ]
        );
    }

    #[test]
    fn test_segment2_f64_negative() {
        let seg = Segment2::new(
            Point2::new(-15.5f64, -5.5f64),
            Point2::new(-5.2f64, -2.8f64),
        );
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f64, f64)> = seg.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(-2.0, -1.0), (-1.0, -1.0)]);
    }

    #[test]
    fn test_segment2_f64_matches_circle() {
        let seg = Segment2::new(Point2::new(0.0f64, 5.0f64), Point2::new(10.0, 5.0));
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(5.0, 0.0),
            radius: 5.0,
        };
        assert!(
            seg.matches_query(&query),
            "Float segment touching circle edge should match"
        );
    }

    // Triangle intersection tests

    #[test]
    fn test_segment2_matches_triangle_inside() {
        // Segment fully inside triangle
        let seg = Segment2::new(Point2::new(4i32, 3), Point2::new(6, 3));
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment inside triangle should match"
        );
    }

    #[test]
    fn test_segment2_matches_triangle_outside() {
        // Segment fully outside triangle
        let seg = Segment2::new(Point2::new(20i32, 20), Point2::new(30, 20));
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            !seg.matches_query(&query),
            "Segment outside triangle should not match"
        );
    }

    #[test]
    fn test_segment2_matches_triangle_crossing() {
        // Segment crosses through triangle
        let seg = Segment2::new(Point2::new(-5i32, 3), Point2::new(15, 3));
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment crossing triangle should match"
        );
    }

    #[test]
    fn test_segment2_matches_triangle_one_endpoint_inside() {
        // One endpoint inside, one outside
        let seg = Segment2::new(Point2::new(5i32, 3), Point2::new(20, 3));
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment with one endpoint inside should match"
        );
    }

    #[test]
    fn test_segment2_matches_triangle_on_edge() {
        // Segment lies on triangle edge
        let seg = Segment2::new(Point2::new(2i32, 0), Point2::new(8, 0));
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment on triangle edge should match"
        );
    }

    #[test]
    fn test_segment2_matches_triangle_touches_vertex() {
        // Segment touches a triangle vertex
        let seg = Segment2::new(Point2::new(-5i32, 0), Point2::new(0, 0));
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment touching triangle vertex should match"
        );
    }

    #[test]
    fn test_segment2_matches_triangle_touches_edge() {
        // Segment touches triangle edge at single point
        let seg = Segment2::new(Point2::new(5i32, 0), Point2::new(5, -10));
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            seg.matches_query(&query),
            "Segment touching triangle edge should match"
        );
    }

    #[test]
    fn test_segment2_matches_triangle_f32_crossing() {
        // Float segment crosses triangle
        let seg = Segment2::new(Point2::new(-2.0f32, 2.0), Point2::new(12.0, 2.0));
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0.0, 0.0),
            p1: Point2::new(10.0, 0.0),
            p2: Point2::new(5.0, 10.0),
        };
        assert!(
            seg.matches_query(&query),
            "Float segment crossing triangle should match"
        );
    }

    #[test]
    fn test_segment2_matches_triangle_f32_outside() {
        // Float segment outside triangle
        let seg = Segment2::new(Point2::new(-5.0f32, 5.0), Point2::new(-2.0, 5.0));
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0.0, 0.0),
            p1: Point2::new(10.0, 0.0),
            p2: Point2::new(5.0, 10.0),
        };
        assert!(
            !seg.matches_query(&query),
            "Float segment outside triangle should not match"
        );
    }
}
