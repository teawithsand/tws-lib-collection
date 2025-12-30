use super::super::SpatialHashMapCoord;
use super::{Aabb, SpatialHashMapShape, SpatialHashMapSpec};
use crate::algo::geom2::spatial_hash::query::SpatialHashMapQuery;

impl<C> SpatialHashMapShape<C> for nalgebra::Point2<C>
where
    C: SpatialHashMapCoord
        + nalgebra::Scalar
        + PartialOrd
        + std::ops::Sub<Output = C>
        + std::ops::Mul<Output = C>
        + std::ops::Add<Output = C>
        + From<u8>,
{
    #[inline]
    fn get_intersecting_cells(
        &self,
        map_spec: SpatialHashMapSpec<C>,
    ) -> impl Iterator<Item = (C, C)> {
        let cell_x = self.coords.x.get_cell_index(map_spec.cell_width);
        let cell_y = self.coords.y.get_cell_index(map_spec.cell_height);
        std::iter::once((cell_x, cell_y))
    }

    fn matches_query(&self, query: &SpatialHashMapQuery<C>) -> bool {
        match query {
            SpatialHashMapQuery::IntersectsCircle { center, radius } => {
                // Check if point is within or on circle: (x-cx)^2 + (y-cy)^2 <= r^2
                let dx = self.coords.x.clone() - center.coords.x.clone();
                let dy = self.coords.y.clone() - center.coords.y.clone();

                // Use checked arithmetic to detect overflow and panic with descriptive message
                let dx_sq = dx
                    .clone()
                    .checked_mul(dx)
                    .expect("Overflow in circle intersection check: dx * dx overflowed");
                let dy_sq = dy
                    .clone()
                    .checked_mul(dy)
                    .expect("Overflow in circle intersection check: dy * dy overflowed");
                let dist_sq = dx_sq
                    .checked_add(dy_sq)
                    .expect("Overflow in circle intersection check: dx_sq + dy_sq overflowed");
                let radius_sq = radius
                    .clone()
                    .checked_mul(radius.clone())
                    .expect("Overflow in circle intersection check: radius * radius overflowed");

                dist_sq <= radius_sq
            }
            SpatialHashMapQuery::IntersectsRectangle {
                corner_one: cornder_one,
                corner_two,
            } => {
                // Check if point is within or on rectangle
                let min_x = if cornder_one.coords.x < corner_two.coords.x {
                    cornder_one.coords.x.clone()
                } else {
                    corner_two.coords.x.clone()
                };
                let max_x = if cornder_one.coords.x > corner_two.coords.x {
                    cornder_one.coords.x.clone()
                } else {
                    corner_two.coords.x.clone()
                };
                let min_y = if cornder_one.coords.y < corner_two.coords.y {
                    cornder_one.coords.y.clone()
                } else {
                    corner_two.coords.y.clone()
                };
                let max_y = if cornder_one.coords.y > corner_two.coords.y {
                    cornder_one.coords.y.clone()
                } else {
                    corner_two.coords.y.clone()
                };

                self.coords.x >= min_x
                    && self.coords.x <= max_x
                    && self.coords.y >= min_y
                    && self.coords.y <= max_y
            }
            SpatialHashMapQuery::IntersectsTriangle { p0, p1, p2 } => {
                // Point-in-triangle test using cross products (barycentric sign method)
                // A point is inside/on the triangle if it's on the same side of all three edges
                // (or on an edge itself)

                let px = self.coords.x.clone();
                let py = self.coords.y.clone();

                // Compute cross products for each edge
                // sign(P, A, B) = (P.x - B.x) * (A.y - B.y) - (A.x - B.x) * (P.y - B.y)
                let sign0 = (px.clone() - p2.coords.x.clone())
                    * (p0.coords.y.clone() - p2.coords.y.clone())
                    - (p0.coords.x.clone() - p2.coords.x.clone())
                        * (py.clone() - p2.coords.y.clone());

                let sign1 = (px.clone() - p0.coords.x.clone())
                    * (p1.coords.y.clone() - p0.coords.y.clone())
                    - (p1.coords.x.clone() - p0.coords.x.clone())
                        * (py.clone() - p0.coords.y.clone());

                let sign2 = (px.clone() - p1.coords.x.clone())
                    * (p2.coords.y.clone() - p1.coords.y.clone())
                    - (p2.coords.x.clone() - p1.coords.x.clone())
                        * (py.clone() - p1.coords.y.clone());

                let zero = C::from(0u8);

                // Point is inside or on boundary if all signs are same, or any is zero (on edge)
                let has_neg = sign0 < zero || sign1 < zero || sign2 < zero;
                let has_pos = sign0 > zero || sign1 > zero || sign2 > zero;

                // For degenerate triangles (all signs zero and triangle has zero area),
                // we should not claim any point is "inside"
                if !has_neg && !has_pos {
                    // Check if triangle is degenerate (zero area)
                    let edge1_x = p1.coords.x.clone() - p0.coords.x.clone();
                    let edge1_y = p1.coords.y.clone() - p0.coords.y.clone();
                    let edge2_x = p2.coords.x.clone() - p0.coords.x.clone();
                    let edge2_y = p2.coords.y.clone() - p0.coords.y.clone();
                    let twice_area = edge1_x * edge2_y - edge1_y * edge2_x;
                    if twice_area == zero {
                        // Degenerate triangle - point is only "inside" if it's on the line segment
                        // For simplicity, return false (point not in degenerate triangle)
                        return false;
                    }
                }

                // If not both positive and negative signs exist, point is inside or on boundary
                !(has_neg && has_pos)
            }
        }
    }

    fn aabb(&self) -> Aabb<C> {
        Aabb {
            min: self.clone(),
            max: self.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use nalgebra::Point2;

    #[test]
    fn test_point2_i32() {
        let point: Point2<i32> = Point2::new(15, 27);
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };
        let cells: Vec<(i32, i32)> = point.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(1, 2)]);
    }

    #[test]
    fn test_point2_u32() {
        let point = Point2::new(0u32, 0u32);
        let spec = SpatialHashMapSpec {
            cell_width: 5,
            cell_height: 5,
        };
        let cells: Vec<(u32, u32)> = point.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0, 0)]);
    }

    #[test]
    fn test_point2_negative() {
        let point = Point2::new(-15i32, -27i32);
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };
        let cells: Vec<(i32, i32)> = point.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(-1, -2)]);
    }

    #[test]
    fn test_point2_boundary_behavior() {
        let spec = SpatialHashMapSpec {
            cell_width: 10,
            cell_height: 10,
        };

        // Points in [0, 10) should be in cell 0
        let p0 = Point2::new(0i32, 0i32);
        let cells: Vec<(i32, i32)> = p0.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0, 0)]);

        let p9 = Point2::new(9i32, 9i32);
        let cells: Vec<(i32, i32)> = p9.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0, 0)]);

        // Point at exactly 10 should be in cell 1 (right-side exclusive)
        let p10 = Point2::new(10i32, 10i32);
        let cells: Vec<(i32, i32)> = p10.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(1, 1)]);

        let p19 = Point2::new(19i32, 19i32);
        let cells: Vec<(i32, i32)> = p19.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(1, 1)]);

        let p20 = Point2::new(20i32, 20i32);
        let cells: Vec<(i32, i32)> = p20.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(2, 2)]);
    }

    #[test]
    fn test_point2_matches_circle_inside() {
        let point = Point2::new(3i32, 4i32);
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(0, 0),
            radius: 10,
        };
        assert!(
            point.matches_query(&query),
            "Point (3,4) should be inside circle at origin with radius 10"
        );
    }

    #[test]
    fn test_point2_matches_circle_on_edge() {
        let point = Point2::new(3i32, 4i32);
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(0, 0),
            radius: 5, // distance is exactly 5
        };
        assert!(
            point.matches_query(&query),
            "Point on circle edge should match"
        );
    }

    #[test]
    fn test_point2_matches_circle_outside() {
        let point = Point2::new(10i32, 10i32);
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(0, 0),
            radius: 5,
        };
        assert!(
            !point.matches_query(&query),
            "Point (10,10) should be outside circle at origin with radius 5"
        );
    }

    #[test]
    fn test_point2_matches_circle_at_center() {
        let point = Point2::new(5i32, 5i32);
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(5, 5),
            radius: 0,
        };
        assert!(
            point.matches_query(&query),
            "Point at center should match circle with radius 0"
        );
    }

    #[test]
    fn test_point2_matches_rectangle_inside() {
        let point = Point2::new(5i32, 5i32);
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            point.matches_query(&query),
            "Point (5,5) should be inside rectangle"
        );
    }

    #[test]
    fn test_point2_matches_rectangle_on_edge() {
        let point = Point2::new(0i32, 5i32);
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            point.matches_query(&query),
            "Point on rectangle edge should match"
        );
    }

    #[test]
    fn test_point2_matches_rectangle_on_corner() {
        let point = Point2::new(10i32, 10i32);
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            point.matches_query(&query),
            "Point on rectangle corner should match"
        );
    }

    #[test]
    fn test_point2_matches_rectangle_outside() {
        let point = Point2::new(15i32, 5i32);
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        assert!(
            !point.matches_query(&query),
            "Point (15,5) should be outside rectangle"
        );
    }

    #[test]
    fn test_point2_matches_rectangle_corners_unordered() {
        let point = Point2::new(5i32, 5i32);
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(10, 10),
            corner_two: Point2::new(0, 0),
        };
        assert!(
            point.matches_query(&query),
            "Rectangle corners can be in any order"
        );
    }

    #[test]
    fn test_point2_f32_basic() {
        let point = Point2::new(15.5f32, 27.3f32);
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f32, f32)> = point.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(1.0, 2.0)]);
    }

    #[test]
    fn test_point2_f32_negative() {
        let point = Point2::new(-5.5f32, -12.7f32);
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f32, f32)> = point.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(-1.0, -2.0)]);
    }

    #[test]
    fn test_point2_f32_boundary_behavior() {
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };

        // Points in [0, 10) should be in cell 0
        let p0 = Point2::new(0.0f32, 0.0f32);
        let cells: Vec<(f32, f32)> = p0.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0.0, 0.0)]);

        let p9_9 = Point2::new(9.99f32, 9.99f32);
        let cells: Vec<(f32, f32)> = p9_9.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(0.0, 0.0)]);

        // Point at exactly 10.0 should be in cell 1
        let p10 = Point2::new(10.0f32, 10.0f32);
        let cells: Vec<(f32, f32)> = p10.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(1.0, 1.0)]);

        let p19_5 = Point2::new(19.5f32, 19.5f32);
        let cells: Vec<(f32, f32)> = p19_5.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(1.0, 1.0)]);

        let p20 = Point2::new(20.0f32, 20.0f32);
        let cells: Vec<(f32, f32)> = p20.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(2.0, 2.0)]);
    }

    #[test]
    fn test_point2_f32_negative_boundary() {
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };

        let p_neg_0_5 = Point2::new(-0.5f32, -0.5f32);
        let cells: Vec<(f32, f32)> = p_neg_0_5.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(-1.0, -1.0)]);

        let p_neg_10 = Point2::new(-10.0f32, -10.0f32);
        let cells: Vec<(f32, f32)> = p_neg_10.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(-1.0, -1.0)]);

        let p_neg_10_1 = Point2::new(-10.1f32, -10.1f32);
        let cells: Vec<(f32, f32)> = p_neg_10_1.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(-2.0, -2.0)]);
    }

    #[test]
    fn test_point2_f32_matches_circle() {
        let point = Point2::new(3.0f32, 4.0f32);
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(0.0, 0.0),
            radius: 10.0,
        };
        assert!(
            point.matches_query(&query),
            "Float point should match circle"
        );
    }

    #[test]
    fn test_point2_f32_matches_rectangle() {
        let point = Point2::new(5.5f32, 7.2f32);
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0.0, 0.0),
            corner_two: Point2::new(10.0, 10.0),
        };
        assert!(
            point.matches_query(&query),
            "Float point should match rectangle"
        );
    }

    #[test]
    fn test_point2_f64_basic() {
        let point = Point2::new(15.5f64, 27.3f64);
        let spec = SpatialHashMapSpec {
            cell_width: 10.0,
            cell_height: 10.0,
        };
        let cells: Vec<(f64, f64)> = point.get_intersecting_cells(spec).collect();
        assert_eq!(cells, vec![(1.0, 2.0)]);
    }

    #[test]
    fn test_point2_f64_matches_circle() {
        let point = Point2::new(3.0f64, 4.0f64);
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(0.0, 0.0),
            radius: 5.0,
        };
        assert!(
            point.matches_query(&query),
            "Float point on circle edge should match"
        );
    }

    // Triangle intersection tests

    #[test]
    fn test_point2_matches_triangle_inside() {
        let point = Point2::new(5i32, 5);
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            point.matches_query(&query),
            "Point inside triangle should match"
        );
    }

    #[test]
    fn test_point2_matches_triangle_outside() {
        let point = Point2::new(20i32, 20);
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            !point.matches_query(&query),
            "Point outside triangle should not match"
        );
    }

    #[test]
    fn test_point2_matches_triangle_on_vertex() {
        let point = Point2::new(0i32, 0);
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            point.matches_query(&query),
            "Point on triangle vertex should match"
        );
    }

    #[test]
    fn test_point2_matches_triangle_on_edge() {
        let point = Point2::new(5i32, 0);
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            point.matches_query(&query),
            "Point on triangle edge should match"
        );
    }

    #[test]
    fn test_point2_matches_triangle_just_outside() {
        let point = Point2::new(0i32, 5);
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0, 0),
            p1: Point2::new(10, 0),
            p2: Point2::new(5, 10),
        };
        assert!(
            !point.matches_query(&query),
            "Point just outside triangle should not match"
        );
    }

    #[test]
    fn test_point2_matches_triangle_f32_inside() {
        let point = Point2::new(5.0f32, 3.0);
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0.0, 0.0),
            p1: Point2::new(10.0, 0.0),
            p2: Point2::new(5.0, 10.0),
        };
        assert!(
            point.matches_query(&query),
            "Float point inside triangle should match"
        );
    }

    #[test]
    fn test_point2_matches_triangle_f32_on_edge() {
        let point = Point2::new(2.5f32, 5.0);
        let query = SpatialHashMapQuery::IntersectsTriangle {
            p0: Point2::new(0.0, 0.0),
            p1: Point2::new(10.0, 0.0),
            p2: Point2::new(5.0, 10.0),
        };
        assert!(
            point.matches_query(&query),
            "Float point on triangle edge should match"
        );
    }
}
