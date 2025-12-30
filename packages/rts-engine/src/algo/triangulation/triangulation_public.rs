use nalgebra::Point2;

use super::traits::{CoordType, IndexType};
use super::types::{InternalTriangle, InternalTriangulation};

/// A triangle in the final triangulation output.
///
/// Contains three vertex indices and references to neighboring triangles.
/// This is the public-facing triangle type returned to library users.
#[derive(Debug, Clone)]
pub struct TriangulationTriangle<I: IndexType> {
    /// Indices of the three vertices in counter-clockwise order.
    pub vertices: [I; 3],

    /// Neighboring triangles opposite to each vertex.
    /// neighbors[i] is opposite to vertices[i].
    pub neighbors: [Option<I>; 3],
}

impl<I: IndexType> TriangulationTriangle<I> {
    /// Create a Triangle from an internal representation.
    pub(crate) fn from_internal_triangle(internal: &InternalTriangle<I>) -> Self {
        Self {
            vertices: internal.vertices,
            neighbors: internal.neighbors,
        }
    }

    /// Returns all three edges of the triangle as pairs of vertex indices.
    ///
    /// Each edge is represented as a tuple (start_vertex, end_vertex) in counter-clockwise order.
    /// The edges are: (v0, v1), (v1, v2), (v2, v0).
    pub fn edges(&self) -> [(I, I); 3] {
        [
            (self.vertices[0], self.vertices[1]),
            (self.vertices[1], self.vertices[2]),
            (self.vertices[2], self.vertices[0]),
        ]
    }
}

/// The final triangulation result.
///
/// Contains all points and triangles from a successful triangulation.
/// This type can only be constructed internally by the triangulation algorithm.
#[derive(Debug, Clone)]
pub struct Triangulation<C: CoordType, I: IndexType> {
    pub points: Vec<Point2<C>>,

    pub triangles: Vec<TriangulationTriangle<I>>,
}

impl<C: CoordType, I: IndexType> Triangulation<C, I> {
    pub(crate) fn from_internal(internal: InternalTriangulation<C, I>) -> Self {
        let mut old_to_new: Vec<Option<I>> = vec![None; internal.triangles.len()];
        let mut new_triangles: Vec<TriangulationTriangle<I>> = Vec::new();

        for (old_idx, opt_tri) in internal.triangles.iter().enumerate() {
            if let Some(triangle) = opt_tri {
                let new_idx =
                    I::from_usize(new_triangles.len()).expect("Too many triangles for index type");
                old_to_new[old_idx] = Some(new_idx);
                new_triangles.push(TriangulationTriangle::from_internal_triangle(triangle));
            }
        }

        for triangle in &mut new_triangles {
            for neighbor_opt in &mut triangle.neighbors {
                if let Some(old_neighbor_idx) = neighbor_opt {
                    let old_neighbor_usize = old_neighbor_idx.to_usize();
                    if let Some(Some(new_neighbor_idx)) = old_to_new.get(old_neighbor_usize) {
                        *neighbor_opt = Some(*new_neighbor_idx);
                    } else {
                        *neighbor_opt = None;
                    }
                }
            }
        }

        Self {
            points: internal.points,
            triangles: new_triangles,
        }
    }

    #[inline]
    pub fn triangles(&self) -> impl Iterator<Item = (I, &TriangulationTriangle<I>)> {
        self.triangles.iter().enumerate().map(|(i, t)| {
            let idx = I::from_usize(i).expect("Index conversion failed");
            (idx, t)
        })
    }

    // Return a cloned Triangle for the given triangle id, or None if out of bounds.
    #[inline]
    pub fn get_triangle(&self, tri_id: I) -> Option<&TriangulationTriangle<I>> {
        self.triangles.get(tri_id.to_usize())
    }

    #[inline]
    pub fn get_triangle_vertices_by_id(&self, tri_id: I) -> Option<[Point2<C>; 3]> {
        let triangle = self.triangles.get(tri_id.to_usize())?;
        // Delegate to the by-triangle extraction helper
        self.get_triangle_vertices(triangle)
    }

    #[inline]
    pub fn get_triangle_vertices(
        &self,
        triangle: &TriangulationTriangle<I>,
    ) -> Option<[Point2<C>; 3]> {
        let p0 = triangle.vertices[0].to_usize();
        let p1 = triangle.vertices[1].to_usize();
        let p2 = triangle.vertices[2].to_usize();

        // Ensure indices are within bounds
        if p0 >= self.points.len() || p1 >= self.points.len() || p2 >= self.points.len() {
            return None;
        }

        Some([self.points[p0], self.points[p1], self.points[p2]])
    }

    /// Returns all three edges of the triangle as pairs of points.
    ///
    /// Each edge is represented as a tuple (start_point, end_point) in counter-clockwise order.
    /// The edges are: (p0, p1), (p1, p2), (p2, p0).
    #[inline]
    pub fn get_triangle_edges_by_id(&self, tri_id: I) -> Option<[(Point2<C>, Point2<C>); 3]> {
        let triangle = self.triangles.get(tri_id.to_usize())?;
        // Delegate to the by-triangle extraction helper
        self.get_triangle_edges(triangle)
    }

    /// Returns all three edges of the triangle as pairs of points plus the neighbor
    /// across each edge (the neighbor opposite the third vertex).
    ///
    /// Each entry is `(start_point, end_point, neighbor_opt)` where `neighbor_opt` is
    /// the optional triangle id on the other side of that edge.
    #[inline]
    pub fn get_triangle_edges_and_neighbors_by_id(
        &self,
        tri_id: I,
    ) -> Option<[(Point2<C>, Point2<C>, Option<I>); 3]> {
        let triangle = self.triangles.get(tri_id.to_usize())?;
        // Delegate to the by-triangle extraction helper
        self.get_triangle_edges_and_neighbors(triangle)
    }

    #[inline]
    pub fn get_triangle_edges_and_neighbors(
        &self,
        triangle: &TriangulationTriangle<I>,
    ) -> Option<[(Point2<C>, Point2<C>, Option<I>); 3]> {
        let p0 = triangle.vertices[0].to_usize();
        let p1 = triangle.vertices[1].to_usize();
        let p2 = triangle.vertices[2].to_usize();

        // Ensure indices are within bounds
        if p0 >= self.points.len() || p1 >= self.points.len() || p2 >= self.points.len() {
            return None;
        }

        // Mapping: neighbors[i] is opposite to vertices[i]. For edge (v0,v1)
        // the opposite vertex is v2 so the neighbor across (v0,v1) is neighbors[2].
        Some([
            (self.points[p0], self.points[p1], triangle.neighbors[2]),
            (self.points[p1], self.points[p2], triangle.neighbors[0]),
            (self.points[p2], self.points[p0], triangle.neighbors[1]),
        ])
    }

    #[inline]
    pub fn get_triangle_edges(
        &self,
        triangle: &TriangulationTriangle<I>,
    ) -> Option<[(Point2<C>, Point2<C>); 3]> {
        let p0 = triangle.vertices[0].to_usize();
        let p1 = triangle.vertices[1].to_usize();
        let p2 = triangle.vertices[2].to_usize();

        // Ensure indices are within bounds
        if p0 >= self.points.len() || p1 >= self.points.len() || p2 >= self.points.len() {
            return None;
        }

        Some([
            (self.points[p0], self.points[p1]),
            (self.points[p1], self.points[p2]),
            (self.points[p2], self.points[p0]),
        ])
    }

    #[inline]
    pub fn num_triangles(&self) -> usize {
        self.triangles.len()
    }

    #[inline]
    pub fn num_points(&self) -> usize {
        self.points.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use nalgebra::Point2;

    #[test]
    fn test_from_internal_empty() {
        let internal = InternalTriangulation::<i32, usize>::new();
        let public = Triangulation::from_internal(internal);

        assert_eq!(public.points.len(), 0);
        assert_eq!(public.triangles.len(), 0);
        assert_eq!(public.num_points(), 0);
        assert_eq!(public.num_triangles(), 0);
    }

    #[test]
    fn test_from_internal_filters_none_triangles() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        internal.add_point(Point2::new(0, 0));
        internal.add_point(Point2::new(10, 0));
        internal.add_point(Point2::new(5, 10));
        internal.add_point(Point2::new(15, 5));

        let tri0 = InternalTriangle::new(0, 1, 2);
        let tri1 = InternalTriangle::new(1, 3, 2);
        internal.add_triangle(tri0);
        internal.add_triangle(tri1);

        internal.triangles[0] = None;

        let public = Triangulation::from_internal(internal);

        assert_eq!(public.points.len(), 4);
        assert_eq!(public.triangles.len(), 1);
        assert_eq!(public.triangles[0].vertices, [1, 3, 2]);
    }

    #[test]
    fn test_from_internal_rebuilds_neighbor_indices() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        internal.add_point(Point2::new(0, 0));
        internal.add_point(Point2::new(10, 0));
        internal.add_point(Point2::new(5, 10));
        internal.add_point(Point2::new(15, 5));

        let mut tri0 = InternalTriangle::new(0, 1, 2);
        let mut tri1 = InternalTriangle::new(1, 3, 2);

        tri0.neighbors[1] = Some(1);
        tri1.neighbors[2] = Some(0);

        internal.add_triangle(tri0);
        internal.add_triangle(tri1);

        let public = Triangulation::from_internal(internal);

        assert_eq!(public.triangles[0].neighbors[1], Some(1));
        assert_eq!(public.triangles[1].neighbors[2], Some(0));
    }

    #[test]
    fn test_from_internal_updates_neighbor_indices_after_deletion() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        internal.add_point(Point2::new(0, 0));
        internal.add_point(Point2::new(10, 0));
        internal.add_point(Point2::new(5, 10));
        internal.add_point(Point2::new(15, 5));
        internal.add_point(Point2::new(20, 10));

        let tri0 = InternalTriangle::new(0, 1, 2);
        let mut tri1 = InternalTriangle::new(1, 3, 2);
        let mut tri2 = InternalTriangle::new(3, 4, 2);

        tri1.neighbors[0] = Some(0);
        tri1.neighbors[1] = Some(2);
        tri2.neighbors[2] = Some(1);

        internal.add_triangle(tri0);
        internal.add_triangle(tri1);
        internal.add_triangle(tri2);

        internal.triangles[0] = None;

        let public = Triangulation::from_internal(internal);

        assert_eq!(public.triangles.len(), 2);

        assert_eq!(public.triangles[0].neighbors[0], None);
        assert_eq!(public.triangles[0].neighbors[1], Some(1));

        assert_eq!(public.triangles[1].neighbors[2], Some(0));
    }

    #[test]
    fn test_from_internal_complex_deletion_pattern() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        for i in 0..6 {
            internal.add_point(Point2::new(i * 10, i * 5));
        }

        let mut triangles = vec![
            InternalTriangle::new(0, 1, 2),
            InternalTriangle::new(1, 3, 2),
            InternalTriangle::new(3, 4, 2),
            InternalTriangle::new(4, 5, 2),
            InternalTriangle::new(5, 0, 2),
        ];

        triangles[1].neighbors[0] = Some(0);
        triangles[1].neighbors[1] = Some(3);
        triangles[3].neighbors[0] = Some(2);
        triangles[3].neighbors[2] = Some(1);
        triangles[4].neighbors[1] = Some(3);

        for tri in triangles {
            internal.add_triangle(tri);
        }

        internal.triangles[0] = None;
        internal.triangles[2] = None;

        let public = Triangulation::from_internal(internal);

        assert_eq!(public.triangles.len(), 3);
        assert_eq!(public.num_triangles(), 3);

        assert_eq!(public.triangles[0].vertices, [1, 3, 2]);
        assert_eq!(public.triangles[0].neighbors[0], None);
        assert_eq!(public.triangles[0].neighbors[1], Some(1));

        assert_eq!(public.triangles[1].vertices, [4, 5, 2]);
        assert_eq!(public.triangles[1].neighbors[0], None);
        assert_eq!(public.triangles[1].neighbors[2], Some(0));

        assert_eq!(public.triangles[2].vertices, [5, 0, 2]);
        assert_eq!(public.triangles[2].neighbors[1], Some(1));
    }

    #[test]
    fn test_public_api_methods() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        internal.add_point(Point2::new(0, 0));
        internal.add_point(Point2::new(10, 0));
        internal.add_point(Point2::new(5, 10));

        let tri = InternalTriangle::new(0, 1, 2);
        internal.add_triangle(tri);

        let public = Triangulation::from_internal(internal);

        assert_eq!(public.points.len(), 3);
        assert_eq!(public.points[0], Point2::new(0, 0));
        assert_eq!(public.points[1], Point2::new(10, 0));
        assert_eq!(public.points[2], Point2::new(5, 10));

        let tri_vec: Vec<_> = public.triangles().collect();
        assert_eq!(tri_vec.len(), 1);
        assert_eq!(tri_vec[0].0, 0);
        assert_eq!(tri_vec[0].1.vertices, [0, 1, 2]);

        let vertices = public.get_triangle_vertices_by_id(0).unwrap();
        assert_eq!(vertices[0], Point2::new(0, 0));
        assert_eq!(vertices[1], Point2::new(10, 0));
        assert_eq!(vertices[2], Point2::new(5, 10));

        assert!(public.get_triangle_vertices_by_id(1).is_none());
    }

    #[test]
    fn test_from_internal_preserves_all_points() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        let points: Vec<Point2<i32>> = (0..10).map(|i| Point2::new(i * 10, i * 5)).collect();

        for &p in &points {
            internal.add_point(p);
        }

        let tri = InternalTriangle::new(0, 1, 2);
        internal.add_triangle(tri);

        let public = Triangulation::from_internal(internal);

        assert_eq!(public.points.len(), 10);
        for (i, &expected) in points.iter().enumerate() {
            assert_eq!(public.points[i], expected);
        }
    }

    #[test]
    fn test_triangle_edges() {
        let triangle = TriangulationTriangle {
            vertices: [0_usize, 1, 2],
            neighbors: [None, None, None],
        };

        let edges = triangle.edges();

        assert_eq!(edges.len(), 3);
        assert_eq!(edges[0], (0, 1));
        assert_eq!(edges[1], (1, 2));
        assert_eq!(edges[2], (2, 0));
    }

    #[test]
    fn test_triangle_edges_preserves_order() {
        let triangle = TriangulationTriangle {
            vertices: [5_usize, 10, 15],
            neighbors: [Some(1), None, Some(2)],
        };

        let edges = triangle.edges();

        assert_eq!(edges[0], (5, 10));
        assert_eq!(edges[1], (10, 15));
        assert_eq!(edges[2], (15, 5));
    }

    #[test]
    fn test_get_triangle_edges_valid_triangle() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        internal.add_point(Point2::new(0, 0));
        internal.add_point(Point2::new(10, 0));
        internal.add_point(Point2::new(5, 10));

        let tri = InternalTriangle::new(0, 1, 2);
        internal.add_triangle(tri);

        let public = Triangulation::from_internal(internal);

        let edges = public.get_triangle_edges_by_id(0).unwrap();

        assert_eq!(edges.len(), 3);
        assert_eq!(edges[0], (Point2::new(0, 0), Point2::new(10, 0)));
        assert_eq!(edges[1], (Point2::new(10, 0), Point2::new(5, 10)));
        assert_eq!(edges[2], (Point2::new(5, 10), Point2::new(0, 0)));
    }

    #[test]
    fn test_get_triangle_edges_invalid_id() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        internal.add_point(Point2::new(0, 0));
        internal.add_point(Point2::new(10, 0));
        internal.add_point(Point2::new(5, 10));

        let tri = InternalTriangle::new(0, 1, 2);
        internal.add_triangle(tri);

        let public = Triangulation::from_internal(internal);

        assert!(public.get_triangle_edges_by_id(1).is_none());
        assert!(public.get_triangle_edges_by_id(100).is_none());
    }

    #[test]
    fn test_get_triangle_edges_multiple_triangles() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        internal.add_point(Point2::new(0, 0));
        internal.add_point(Point2::new(1, 0));
        internal.add_point(Point2::new(0, 1));
        internal.add_point(Point2::new(1, 1));

        let tri0 = InternalTriangle::new(0, 1, 2);
        let tri1 = InternalTriangle::new(1, 3, 2);
        internal.add_triangle(tri0);
        internal.add_triangle(tri1);

        let public = Triangulation::from_internal(internal);

        let edges0 = public.get_triangle_edges_by_id(0).unwrap();
        assert_eq!(edges0[0].0, Point2::new(0, 0));
        assert_eq!(edges0[0].1, Point2::new(1, 0));

        let edges1 = public.get_triangle_edges_by_id(1).unwrap();
        assert_eq!(edges1[0].0, Point2::new(1, 0));
        assert_eq!(edges1[0].1, Point2::new(1, 1));
    }

    #[test]
    fn test_get_triangle_edges_and_neighbors_valid_triangle() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        internal.add_point(Point2::new(0, 0));
        internal.add_point(Point2::new(10, 0));
        internal.add_point(Point2::new(5, 10));

        let tri = InternalTriangle::new(0, 1, 2);
        internal.add_triangle(tri);

        let public = Triangulation::from_internal(internal);

        let edgesn = public.get_triangle_edges_and_neighbors_by_id(0).unwrap();

        assert_eq!(edgesn[0].0, Point2::new(0, 0));
        assert_eq!(edgesn[0].1, Point2::new(10, 0));
        assert_eq!(edgesn[0].2, None);
        assert_eq!(edgesn[1].2, None);
        assert_eq!(edgesn[2].2, None);
    }

    #[test]
    fn test_get_triangle_edges_and_neighbors_invalid_id() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        internal.add_point(Point2::new(0, 0));
        internal.add_point(Point2::new(10, 0));
        internal.add_point(Point2::new(5, 10));

        let tri = InternalTriangle::new(0, 1, 2);
        internal.add_triangle(tri);

        let public = Triangulation::from_internal(internal);

        assert!(public.get_triangle_edges_and_neighbors_by_id(1).is_none());
        assert!(public.get_triangle_edges_and_neighbors_by_id(100).is_none());
    }

    #[test]
    fn test_get_triangle_edges_and_neighbors_multiple_triangles() {
        let mut internal = InternalTriangulation::<i32, usize>::new();

        internal.add_point(Point2::new(0, 0));
        internal.add_point(Point2::new(1, 0));
        internal.add_point(Point2::new(0, 1));
        internal.add_point(Point2::new(1, 1));

        let mut tri0 = InternalTriangle::new(0, 1, 2);
        let mut tri1 = InternalTriangle::new(1, 3, 2);

        // Set neighbor indices on the internal triangles to reflect adjacency
        tri0.neighbors[1] = Some(1);
        tri1.neighbors[2] = Some(0);

        internal.add_triangle(tri0);
        internal.add_triangle(tri1);

        let public = Triangulation::from_internal(internal);

        let edges0 = public.get_triangle_edges_and_neighbors_by_id(0).unwrap();
        // For tri0 we set neighbors[1] = Some(1), which is opposite v1 and
        // therefore corresponds to edge (v2,v0) (third entry)
        assert_eq!(edges0[2].2, Some(1));

        let edges1 = public.get_triangle_edges_and_neighbors_by_id(1).unwrap();
        // For tri1 we set neighbors[2] = Some(0), which is opposite v2 and
        // therefore corresponds to edge (v0,v1) (first entry)
        assert_eq!(edges1[0].2, Some(0));
    }
}
