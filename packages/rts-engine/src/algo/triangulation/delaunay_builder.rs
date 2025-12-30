use nalgebra::Point2;
use std::marker::PhantomData;

use super::delaunay_point_insertion::insert_point;
use super::delaunay_supertriangle::create_supertriangle_heur;
use super::delaunay_validation::*;
use super::error::TriangulationError;
use super::geometry::point_strictly_in_triangle;
use super::traits::{CoordType, IndexType};
use super::triangulation_public::Triangulation;
use super::types::{InternalTriangulation, TriangulatorConfig};

/// Builder for creating Delaunay triangulations and Constrained Delaunay Triangulations (CDT).
///
/// The triangulator can be configured with various validation checks and custom supertriangl es.
pub struct Triangulator<C: CoordType, I: IndexType> {
    config: TriangulatorConfig,
    custom_supertriangle: Option<[Point2<C>; 3]>,
    _phantom: PhantomData<I>,
}

impl<C: CoordType, I: IndexType> Triangulator<C, I> {
    pub fn new() -> Self {
        Self {
            config: TriangulatorConfig::default(),
            custom_supertriangle: None,
            _phantom: PhantomData,
        }
    }

    pub fn safe() -> Self {
        Self {
            config: TriangulatorConfig::safe(),
            custom_supertriangle: None,
            _phantom: PhantomData,
        }
    }

    pub fn unchecked() -> Self {
        Self {
            config: TriangulatorConfig::unchecked(),
            custom_supertriangle: None,
            _phantom: PhantomData,
        }
    }

    pub fn with_config(mut self, config: TriangulatorConfig) -> Self {
        self.config = config;
        self
    }

    pub fn with_supertriangle(mut self, supertriangle: [nalgebra::Point2<C>; 3]) -> Self
    where
        C: 'static,
    {
        self.custom_supertriangle = Some([
            supertriangle[0].into(),
            supertriangle[1].into(),
            supertriangle[2].into(),
        ]);
        self
    }
}

impl<C: CoordType, I: IndexType> Default for Triangulator<C, I> {
    fn default() -> Self {
        Self::new()
    }
}

impl<C: CoordType, I: IndexType> Triangulator<C, I> {
    /// Builds a Delaunay triangulation from a set of points.
    pub fn build_delaunay(
        &self,
        points: &[nalgebra::Point2<C>],
    ) -> Result<Triangulation<C, I>, TriangulationError>
    where
        C: 'static,
    {
        let internal_points: Vec<Point2<C>> = points.iter().map(|&p| p.into()).collect();

        let mut triang = self.build_delaunay_with_supertriangle(&internal_points)?;

        triang.remove_supertriangle();

        if self.config.check_supertriangle_removal {
            validate_supertriangle_removal(&triang)?;
        }

        Ok(Triangulation::from_internal(triang))
    }

    /// Builds a Delaunay triangulation including the supertriangle vertices.
    ///
    /// This is an internal method used by both `build_delaunay` and `build_cdt`.
    pub(crate) fn build_delaunay_with_supertriangle(
        &self,
        points: &[Point2<C>],
    ) -> Result<InternalTriangulation<C, I>, TriangulationError> {
        if points.is_empty() {
            return Err(TriangulationError::InvalidInput {
                message: "Cannot triangulate empty point set".to_string(),
            });
        }

        if self.config.check_duplicate_points {
            check_duplicate_points(points)?;
        }

        let mut triang = InternalTriangulation::new();

        for &point in points {
            triang.add_point(point);
        }

        let num_points = triang.points.len();

        let super_points = if let Some(custom_super) = self.custom_supertriangle {
            custom_super
        } else {
            compute_bounding_box_supertriangle(&triang.points)?
        };

        if self.config.check_strict_supertriangle_containment {
            validate_supertriangle_containment(&triang.points[0..num_points], &super_points)?;
        }

        let s0 = triang.add_point(super_points[0]);
        let s1 = triang.add_point(super_points[1]);
        let s2 = triang.add_point(super_points[2]);

        triang.super_indices = [s0, s1, s2];

        let (super_tri, _swapped) = triang.new_triangle_ccw(s0, s1, s2)?;
        triang.add_triangle(super_tri);

        let mut indices: Vec<I> = (0..num_points).map(|i| I::from_usize(i).unwrap()).collect();
        sort_indices_by_points_xy(&mut indices, &triang.points);

        for &point_idx in &indices {
            insert_point(&mut triang, point_idx)?;
        }

        Ok(triang)
    }

    /// Builds a Constrained Delaunay Triangulation (CDT) from points and constraint edges.
    pub fn build_cdt(
        &self,
        points: &[nalgebra::Point2<C>],
        constraints: &[(I, I)],
    ) -> Result<Triangulation<C, I>, TriangulationError>
    where
        C: 'static,
    {
        let internal_points: Vec<Point2<C>> = points.iter().map(|&p| p.into()).collect();
        let num_points = points.len();

        check_constraint_indices(constraints, num_points)?;

        if self.config.check_duplicate_constraints {
            check_duplicate_constraints(constraints)?;
        }

        if self.config.check_intersecting_constraints {
            check_intersecting_constraints(constraints, &internal_points)?;
        }

        if self.config.check_constraint_collinearity {
            check_constraint_collinearity(constraints, &internal_points)?;
        }

        let mut triang = self.build_delaunay_with_supertriangle(&internal_points)?;

        for &(v1, v2) in constraints {
            super::delaunay_constrain::enforce_constraint(&mut triang, v1, v2)?;
        }

        if self.config.check_post_constraint_validation {
            validate_constraints_in_non_super_triangles(&triang, constraints)?;
        }

        triang.remove_supertriangle();

        if self.config.check_supertriangle_removal {
            validate_supertriangle_removal(&triang)?;
        }

        Ok(Triangulation::from_internal(triang))
    }
}

/// Sorts indices by their corresponding points, first by y-coordinate then by x-coordinate.
pub fn sort_indices_by_points_xy<C: CoordType, I: IndexType>(
    indices: &mut [I],
    points: &[Point2<C>],
) {
    indices.sort_by(|&a, &b| {
        let pa = points[a.to_usize()];
        let pb = points[b.to_usize()];

        match pa.y.cmp(&pb.y) {
            std::cmp::Ordering::Equal => pa.x.cmp(&pb.x),
            other => other,
        }
    });
}

/// Computes a supertriangle from the bounding box of the points.
fn compute_bounding_box_supertriangle<C: CoordType>(
    points: &[Point2<C>],
) -> Result<[Point2<C>; 3], TriangulationError> {
    let mut min_x: C = points[0].x;
    let mut max_x: C = points[0].x;
    let mut min_y: C = points[0].y;
    let mut max_y: C = points[0].y;

    for point in points {
        min_x = min_x.min(point.x);
        max_x = max_x.max(point.x);
        min_y = min_y.min(point.y);
        max_y = max_y.max(point.y);
    }

    create_supertriangle_heur(min_x, min_y, max_x, max_y)
}

/// Validates that all points are strictly contained within the supertriangle.
fn validate_supertriangle_containment<C: CoordType>(
    points: &[Point2<C>],
    super_points: &[Point2<C>; 3],
) -> Result<(), TriangulationError> {
    for (idx, point) in points.iter().enumerate() {
        if !point_strictly_in_triangle(*super_points, *point)? {
            return Err(TriangulationError::InvalidInput {
                message: format!(
                    "Point2 {} at ({:?}, {:?}) is not strictly inside the supertriangle (must not be on edges). This can happen with duplicate or near-duplicate points at the bounding box extremes.",
                    idx, point.x, point.y
                ),
            });
        }
    }
    Ok(())
}

/// Validates that constraint edges exist in non-super triangles after enforcement.
fn validate_constraints_in_non_super_triangles<C: CoordType, I: IndexType>(
    triang: &InternalTriangulation<C, I>,
    constraints: &[(I, I)],
) -> Result<(), TriangulationError> {
    for &(v1, v2) in constraints {
        let mut found_in_non_super_triangle = false;

        for (i, opt_tri) in triang.triangles.iter().enumerate() {
            if let Some(tri) = opt_tri {
                let tri_id = I::from_usize(i).unwrap();

                if triang.triangle_has_super_vertex(tri_id) {
                    continue;
                }

                for edge_idx in 0..3 {
                    let edge_v1 = tri.vertices[edge_idx];
                    let edge_v2 = tri.vertices[(edge_idx + 1) % 3];

                    if (edge_v1 == v1 && edge_v2 == v2) || (edge_v1 == v2 && edge_v2 == v1) {
                        found_in_non_super_triangle = true;
                        break;
                    }
                }

                if found_in_non_super_triangle {
                    break;
                }
            }
        }

        if !found_in_non_super_triangle {
            return Err(TriangulationError::InvalidInput {
                message: format!(
                    "Constraint edge ({:?}, {:?}) only exists in triangles containing super-vertices. \
                    This typically happens when points are at or very near the bounding box extremes. \
                    Try using a custom supertriangle or adjusting point positions slightly.",
                    v1, v2
                ),
            });
        }
    }
    Ok(())
}

/// Validates that no triangles contain super-vertices after supertriangle removal.
fn validate_supertriangle_removal<C: CoordType, I: IndexType>(
    triang: &InternalTriangulation<C, I>,
) -> Result<(), TriangulationError> {
    for (i, opt_tri) in triang.triangles.iter().enumerate() {
        if let Some(_tri) = opt_tri {
            let tri_id = I::from_usize(i).unwrap();
            if triang.triangle_has_super_vertex(tri_id) {
                return Err(TriangulationError::InternalError {
                    message: format!(
                        "Triangle {} still contains super-vertex after removal. \
                        This indicates the supertriangle was too small to contain all points.",
                        i
                    ),
                });
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_can_do_simple_triangulation_with_defaults() {
        let tri = Triangulator::<i32, u32>::safe();

        const POINTS: &[Point2<i32>] = &[Point2::new(0, 0), Point2::new(1, 1), Point2::new(0, 1)];

        let tri = tri.build_cdt(POINTS, &[]).unwrap();

        assert_eq!(tri.num_points(), POINTS.len());
        assert_eq!(tri.num_triangles(), 1);
    }
}
