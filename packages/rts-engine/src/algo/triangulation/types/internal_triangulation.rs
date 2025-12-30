use nalgebra::Point2;

use super::super::traits::{CoordType, IndexType, MathType};
use super::internal_triangle::InternalTriangle;

/// A complete triangulation with points and triangles.
#[derive(Debug, Clone)]
pub struct InternalTriangulation<C: CoordType, I: IndexType> {
    /// All points in the triangulation.
    pub points: Vec<Point2<C>>,

    /// All triangles. None represents an inactive (deleted) triangle.
    pub(crate) triangles: Vec<Option<InternalTriangle<I>>>,

    /// Indices of the three super-triangle vertices.
    /// These should be removed from the final triangulation.
    pub super_indices: [I; 3],
}

impl<C: CoordType, I: IndexType> InternalTriangulation<C, I> {
    /// Create a new empty triangulation.
    pub fn new() -> Self {
        Self {
            points: Vec::new(),
            triangles: Vec::new(),
            super_indices: [I::max_value(), I::max_value(), I::max_value()],
        }
    }

    /// Add a point and return its index.
    pub fn add_point(&mut self, point: Point2<C>) -> I {
        let idx = I::from_usize(self.points.len()).expect("Too many points for index type");
        self.points.push(point);
        idx
    }

    /// Add a triangle and return its ID.
    pub(crate) fn add_triangle(&mut self, triangle: InternalTriangle<I>) -> I {
        let id = I::from_usize(self.triangles.len()).expect("Too many triangles for index type");
        self.triangles.push(Some(triangle));
        id
    }

    /// Create a new triangle with vertices in counter-clockwise order.
    /// If the given vertices are in clockwise order, they will be swapped to make them CCW.
    /// Returns (triangle, swapped) where swapped is true if vertices 1 and 2 were swapped.
    pub fn new_triangle_ccw(
        &self,
        v0: I,
        v1: I,
        v2: I,
    ) -> Result<(InternalTriangle<I>, bool), super::super::error::TriangulationError> {
        use super::super::geometry::orientation;

        let p0 = self.points[v0.to_usize()];
        let p1 = self.points[v1.to_usize()];
        let p2 = self.points[v2.to_usize()];

        let orient = orientation(p0, p1, p2)?;

        if orient < C::Math::zero() {
            // Clockwise - swap v1 and v2 to make it counter-clockwise
            Ok((InternalTriangle::new(v0, v2, v1), true))
        } else {
            // Counter-clockwise or collinear - keep as is
            Ok((InternalTriangle::new(v0, v1, v2), false))
        }
    }

    /// Check if a triangle contains any super-triangle vertex.
    pub fn triangle_has_super_vertex(&self, tri_id: I) -> bool {
        if let Some(Some(triangle)) = self.triangles.get(tri_id.to_usize()) {
            for &v in &triangle.vertices {
                if v == self.super_indices[0]
                    || v == self.super_indices[1]
                    || v == self.super_indices[2]
                {
                    return true;
                }
            }
        }
        false
    }

    /// Remove the supertriangle from the triangulation.
    ///
    /// This method removes all triangles containing super-vertices and removes
    /// the super-vertices from the points list. Since super-vertices are always
    /// the last three points added, they can be efficiently removed by truncating
    /// the points vector.
    ///
    /// # Panics
    ///
    /// Panics if the super-vertices are not the last three points in the points list.
    pub fn remove_supertriangle(&mut self) {
        let super_indices: [I; 3] = self.super_indices;

        // Remove triangles containing super-vertices
        for opt_tri in &mut self.triangles {
            if let Some(tri) = opt_tri {
                for &v in &tri.vertices {
                    if v == super_indices[0] || v == super_indices[1] || v == super_indices[2] {
                        *opt_tri = None;
                        break;
                    }
                }
            }
        }

        // Super-vertices should be the last three points added
        // Verify this assumption
        let num_points = self.points.len();
        let expected_s0 = I::from_usize(num_points - 3).expect("Not enough points");
        let expected_s1 = I::from_usize(num_points - 2).expect("Not enough points");
        let expected_s2 = I::from_usize(num_points - 1).expect("Not enough points");

        assert_eq!(
            super_indices[0], expected_s0,
            "Super-vertex 0 is not at expected position"
        );
        assert_eq!(
            super_indices[1], expected_s1,
            "Super-vertex 1 is not at expected position"
        );
        assert_eq!(
            super_indices[2], expected_s2,
            "Super-vertex 2 is not at expected position"
        );

        // Simply truncate the last three points (the super-vertices)
        self.points.truncate(num_points - 3);

        // No need to remap vertex indices since we only removed the last three points
        // and all triangles referencing them have already been removed
    }

    /// Find all triangles that contain both vertices v1 and v2.
    ///
    /// This is useful for finding triangles that share an edge.
    pub fn triangles_for_edge(&self, v1: I, v2: I) -> impl Iterator<Item = I> + '_ {
        self.triangles
            .iter()
            .enumerate()
            .filter_map(move |(i, opt_tri)| {
                let tri = opt_tri.as_ref()?;
                if tri.has_vertex(v1) && tri.has_vertex(v2) {
                    I::from_usize(i)
                } else {
                    None
                }
            })
    }

    /// Get the quadrilateral formed by two adjacent triangles.
    ///
    /// Returns the four vertices (v0, v1, v2, v3) where:
    /// - v0 and v2 are the shared edge vertices
    /// - v1 is the non-shared vertex from tri1
    /// - v3 is the non-shared vertex from tri2
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - Either triangle does not exist
    /// - The triangles do not share exactly one edge (two vertices)
    pub fn get_quadrilateral(
        &self,
        tri1_id: I,
        tri2_id: I,
    ) -> Result<(I, I, I, I), super::super::error::TriangulationError> {
        let tri1 = self
            .triangles
            .get(tri1_id.to_usize())
            .and_then(|opt| opt.as_ref())
            .ok_or_else(|| super::super::error::TriangulationError::InvalidInput {
                message: "Triangle 1 does not exist".to_string(),
            })?;

        let tri2 = self
            .triangles
            .get(tri2_id.to_usize())
            .and_then(|opt| opt.as_ref())
            .ok_or_else(|| super::super::error::TriangulationError::InvalidInput {
                message: "Triangle 2 does not exist".to_string(),
            })?;

        let mut shared = [I::max_value(); 3];
        let mut count = 0;

        for &v in &tri1.vertices {
            if tri2.has_vertex(v) {
                shared[count] = v;
                count += 1;
            }
        }

        if count != 2 {
            return Err(super::super::error::TriangulationError::InvalidInput {
                message: "Triangles do not share exactly one edge".to_string(),
            });
        }

        let v_tri1 = tri1
            .vertices
            .iter()
            .find(|&&v| v != shared[0] && v != shared[1])
            .copied()
            .ok_or_else(|| super::super::error::TriangulationError::InternalError {
                message: "Could not find non-shared vertex in triangle 1".to_string(),
            })?;

        let v_tri2 = tri2
            .vertices
            .iter()
            .find(|&&v| v != shared[0] && v != shared[1])
            .copied()
            .ok_or_else(|| super::super::error::TriangulationError::InternalError {
                message: "Could not find non-shared vertex in triangle 2".to_string(),
            })?;

        Ok((shared[0], v_tri1, shared[1], v_tri2))
    }
}

impl<C: CoordType, I: IndexType> Default for InternalTriangulation<C, I> {
    fn default() -> Self {
        Self::new()
    }
}
