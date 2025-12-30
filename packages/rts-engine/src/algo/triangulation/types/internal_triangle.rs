use super::super::traits::IndexType;

/// Internal triangle representation used during triangulation construction.
///
/// Stores three vertex indices and three neighbor triangle IDs.
/// The neighbor at index i is opposite to the vertex at index i.
#[derive(Debug, Clone)]
pub(crate) struct InternalTriangle<I: IndexType> {
    /// Indices of the three vertices in counter-clockwise order.
    pub vertices: [I; 3],

    /// Neighboring triangles opposite to each vertex.
    /// neighbors[i] is opposite to vertices[i].
    pub neighbors: [Option<I>; 3],
}

impl<I: IndexType> InternalTriangle<I> {
    /// Create a new triangle with the given vertices.
    pub fn new(v0: I, v1: I, v2: I) -> Self {
        Self {
            vertices: [v0, v1, v2],
            neighbors: [None, None, None],
        }
    }

    /// Set the neighbor opposite to the given edge index.
    pub fn set_neighbor(&mut self, edge_idx: usize, neighbor: Option<I>) {
        self.neighbors[edge_idx] = neighbor;
    }

    /// Check if this triangle contains the given vertex index.
    pub fn has_vertex(&self, vertex_idx: I) -> bool {
        self.vertices[0] == vertex_idx
            || self.vertices[1] == vertex_idx
            || self.vertices[2] == vertex_idx
    }

    /// Find which edge index (0-2) the given vertex is at.
    /// Returns None if the vertex is not in this triangle.
    pub fn find_vertex_index(&self, vertex_idx: I) -> Option<usize> {
        for i in 0..3 {
            if self.vertices[i] == vertex_idx {
                return Some(i);
            }
        }
        None
    }
}
