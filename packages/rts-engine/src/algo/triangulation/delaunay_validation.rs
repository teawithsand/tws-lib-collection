use nalgebra::Point2;

use super::error::TriangulationError;
use super::geometry::{point_on_segment, segments_intersect_proper};
use super::traits::{CoordType, IndexType};

/// Checks if there are any duplicate points in the input.
pub fn check_duplicate_points<C: CoordType>(
    points: &[Point2<C>],
) -> Result<(), TriangulationError> {
    for i in 0..points.len() {
        for j in (i + 1)..points.len() {
            if points[i].x == points[j].x && points[i].y == points[j].y {
                return Err(TriangulationError::InvalidInput {
                    message: format!(
                        "Duplicate points found at indices {} and {}: ({:?}, {:?})",
                        i, j, points[i].x, points[i].y
                    ),
                });
            }
        }
    }
    Ok(())
}

/// Checks if constraint edges reference valid point indices.
pub fn check_constraint_indices<I: IndexType>(
    constraints: &[(I, I)],
    num_points: usize,
) -> Result<(), TriangulationError> {
    for (v1, v2) in constraints {
        if v1.to_usize() >= num_points || v2.to_usize() >= num_points {
            return Err(TriangulationError::InvalidInput {
                message: format!(
                    "Constraint edge ({:?}, {:?}) references invalid point indices (only {} points)",
                    v1, v2, num_points
                ),
            });
        }
    }
    Ok(())
}

/// Checks if there are any duplicate constraint edges.
pub fn check_duplicate_constraints<I: IndexType>(
    constraints: &[(I, I)],
) -> Result<(), TriangulationError> {
    for i in 0..constraints.len() {
        for j in (i + 1)..constraints.len() {
            let (v1_i, v2_i) = constraints[i];
            let (v1_j, v2_j) = constraints[j];

            if (v1_i == v1_j && v2_i == v2_j) || (v1_i == v2_j && v2_i == v1_j) {
                return Err(TriangulationError::InvalidInput {
                    message: format!(
                        "Duplicate constraint edge found at indices {} and {}: ({:?}, {:?})",
                        i, j, v1_i, v2_i
                    ),
                });
            }
        }
    }
    Ok(())
}

/// Checks if any constraint edges intersect each other (excluding shared vertices).
pub fn check_intersecting_constraints<C: CoordType, I: IndexType>(
    constraints: &[(I, I)],
    points: &[Point2<C>],
) -> Result<(), TriangulationError> {
    for i in 0..constraints.len() {
        for j in (i + 1)..constraints.len() {
            let (v1_i, v2_i) = constraints[i];
            let (v1_j, v2_j) = constraints[j];

            // Skip if edges share a vertex
            if v1_i == v1_j || v1_i == v2_j || v2_i == v1_j || v2_i == v2_j {
                continue;
            }

            let p1 = points[v1_i.to_usize()];
            let p2 = points[v2_i.to_usize()];
            let p3 = points[v1_j.to_usize()];
            let p4 = points[v2_j.to_usize()];

            if segments_intersect_proper(p1, p2, p3, p4)? {
                return Err(TriangulationError::InvalidInput {
                    message: format!(
                        "Constraint edges intersect: edge {} ({:?}, {:?}) crosses edge {} ({:?}, {:?})",
                        i, v1_i, v2_i, j, v1_j, v2_j
                    ),
                });
            }
        }
    }
    Ok(())
}

/// Checks if any constraint edges pass through other vertices (collinearity check).
pub fn check_constraint_collinearity<C: CoordType, I: IndexType>(
    constraints: &[(I, I)],
    points: &[Point2<C>],
) -> Result<(), TriangulationError> {
    for (constraint_idx, &(v1, v2)) in constraints.iter().enumerate() {
        let p1 = points[v1.to_usize()];
        let p2 = points[v2.to_usize()];

        for (vertex_idx, &p) in points.iter().enumerate() {
            if vertex_idx == v1.to_usize() || vertex_idx == v2.to_usize() {
                continue;
            }

            if point_on_segment(p, p1, p2)? {
                return Err(TriangulationError::InvalidInput {
                    message: format!(
                        "Constraint edge {} ({:?}, {:?}) passes through vertex {} at {:?}",
                        constraint_idx, v1, v2, vertex_idx, p
                    ),
                });
            }
        }
    }
    Ok(())
}
