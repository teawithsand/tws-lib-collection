use super::error::TriangulationError;
use super::geometry::in_circumcircle_det;
use super::traits::{CoordType, IndexType, MathType};
use super::types::{InternalTriangle, InternalTriangulation};

/// Iteratively flips edges to restore the Delaunay property.
///
/// Edges are checked and flipped if the circumcircle test fails,
/// and new edges are added to the check list until no more flips are needed.
pub fn flip_edges_iterative<C: CoordType, I: IndexType>(
    triang: &mut InternalTriangulation<C, I>,
    edges_to_check: &mut Vec<(I, I, I)>,
) -> Result<(), TriangulationError> {
    while let Some((v1, v2, tri_id)) = edges_to_check.pop() {
        if triang.triangles[tri_id.to_usize()].is_none() {
            continue;
        }

        let neighbor_id = find_neighbor_across_edge(triang, tri_id, v1, v2)?;

        if neighbor_id.is_none() {
            continue;
        }

        let neighbor_id = neighbor_id.unwrap();

        if triang.triangles[neighbor_id.to_usize()].is_none() {
            continue;
        }

        let tri = triang.triangles[tri_id.to_usize()].as_ref().unwrap();
        let neighbor = triang.triangles[neighbor_id.to_usize()].as_ref().unwrap();

        let v_tri = tri
            .vertices
            .iter()
            .find(|&&v| v != v1 && v != v2)
            .copied()
            .ok_or(TriangulationError::InternalError {
                message: "Could not find opposite vertex in triangle".to_string(),
            })?;

        let v_neighbor = neighbor
            .vertices
            .iter()
            .find(|&&v| v != v1 && v != v2)
            .copied()
            .ok_or(TriangulationError::InternalError {
                message: "Could not find opposite vertex in neighbor".to_string(),
            })?;

        let tri_verts = [
            triang.points[tri.vertices[0].to_usize()],
            triang.points[tri.vertices[1].to_usize()],
            triang.points[tri.vertices[2].to_usize()],
        ];
        let test_point = triang.points[v_neighbor.to_usize()];

        let det = in_circumcircle_det(tri_verts[0], tri_verts[1], tri_verts[2], test_point)?;

        if det > C::Math::zero() {
            let new_edges = flip_edge(triang, tri_id, neighbor_id, v1, v2, v_tri, v_neighbor)?;

            edges_to_check.extend(new_edges);
        }
    }

    Ok(())
}

/// Finds the neighboring triangle across a given edge.
fn find_neighbor_across_edge<C: CoordType, I: IndexType>(
    triang: &InternalTriangulation<C, I>,
    tri_id: I,
    v1: I,
    v2: I,
) -> Result<Option<I>, TriangulationError> {
    let tri = triang.triangles[tri_id.to_usize()]
        .as_ref()
        .ok_or_else(|| TriangulationError::InternalError {
            message: "Triangle is inactive".to_string(),
        })?;

    // Find which edge (0, 1, or 2) contains both v1 and v2
    for i in 0..3 {
        let edge_v1 = tri.vertices[(i + 1) % 3];
        let edge_v2 = tri.vertices[(i + 2) % 3];

        if (edge_v1 == v1 && edge_v2 == v2) || (edge_v1 == v2 && edge_v2 == v1) {
            // This is the edge, return the neighbor opposite to vertex i
            return Ok(tri.neighbors[i]);
        }
    }

    Ok(None)
}

/// Flips an edge between two triangles by replacing them with two new triangles.
///
/// Returns the four external edges that should be checked for further flipping.
fn flip_edge<C: CoordType, I: IndexType>(
    triang: &mut InternalTriangulation<C, I>,
    tri1_id: I,
    tri2_id: I,
    shared_v1: I,
    shared_v2: I,
    v_tri1: I,
    v_tri2: I,
) -> Result<Vec<(I, I, I)>, TriangulationError> {
    // Store neighbor information before modifying
    let tri1 = triang.triangles[tri1_id.to_usize()]
        .as_ref()
        .ok_or_else(|| TriangulationError::InternalError {
            message: "Triangle 1 is inactive".to_string(),
        })?;
    let tri2 = triang.triangles[tri2_id.to_usize()]
        .as_ref()
        .ok_or_else(|| TriangulationError::InternalError {
            message: "Triangle 2 is inactive".to_string(),
        })?;

    let neighbors = extract_edge_neighbors(tri1, tri2, shared_v1, shared_v2, v_tri1, v_tri2);

    // Mark old triangles as inactive
    triang.triangles[tri1_id.to_usize()] = None;
    triang.triangles[tri2_id.to_usize()] = None;

    // Create two new triangles with the flipped diagonal (v_tri1 to v_tri2)
    let mut new_tri1 = InternalTriangle::new(v_tri1, shared_v1, v_tri2);
    let mut new_tri2 = InternalTriangle::new(v_tri1, v_tri2, shared_v2);

    let new_tri1_id = I::from_usize(triang.triangles.len()).unwrap();
    let new_tri2_id = I::from_usize(triang.triangles.len() + 1).unwrap();

    // Set up neighbors for new_tri1: vertices are [v_tri1, shared_v1, v_tri2]
    // neighbor[0] is opposite v_tri1, across edge (shared_v1, v_tri2) -> from tri2
    // neighbor[1] is opposite shared_v1, across edge (v_tri2, v_tri1) -> new_tri2
    // neighbor[2] is opposite v_tri2, across edge (v_tri1, shared_v1) -> from tri1
    new_tri1.neighbors[0] = neighbors.tri2_at_v2;
    new_tri1.neighbors[1] = Some(new_tri2_id);
    new_tri1.neighbors[2] = neighbors.tri1_at_v2;

    // Set up neighbors for new_tri2: vertices are [v_tri1, v_tri2, shared_v2]
    // neighbor[0] is opposite v_tri1, across edge (v_tri2, shared_v2) -> from tri2
    // neighbor[1] is opposite v_tri2, across edge (shared_v2, v_tri1) -> from tri1
    // neighbor[2] is opposite shared_v2, across edge (v_tri1, v_tri2) -> new_tri1
    new_tri2.neighbors[0] = neighbors.tri2_at_v1;
    new_tri2.neighbors[1] = neighbors.tri1_at_v1;
    new_tri2.neighbors[2] = Some(new_tri1_id);

    triang.triangles.push(Some(new_tri1));
    triang.triangles.push(Some(new_tri2));

    // Update external neighbors to point back to new triangles
    update_neighbor_pointer(triang, neighbors.tri2_at_v2, tri1_id, tri2_id, new_tri1_id);
    update_neighbor_pointer(triang, neighbors.tri1_at_v2, tri1_id, tri2_id, new_tri1_id);
    update_neighbor_pointer(triang, neighbors.tri2_at_v1, tri1_id, tri2_id, new_tri2_id);
    update_neighbor_pointer(triang, neighbors.tri1_at_v1, tri1_id, tri2_id, new_tri2_id);

    // Return the four external edges to check
    let mut edges_to_check = Vec::new();
    edges_to_check.push((shared_v1, v_tri2, new_tri1_id));
    edges_to_check.push((v_tri1, shared_v1, new_tri1_id));
    edges_to_check.push((v_tri2, shared_v2, new_tri2_id));
    edges_to_check.push((shared_v2, v_tri1, new_tri2_id));

    Ok(edges_to_check)
}

/// Neighbor information extracted from two triangles sharing an edge.
struct EdgeNeighbors<I: IndexType> {
    tri1_at_v1: Option<I>,
    tri1_at_v2: Option<I>,
    tri2_at_v1: Option<I>,
    tri2_at_v2: Option<I>,
}

/// Extracts the neighbor information from two triangles that will be used after flipping.
fn extract_edge_neighbors<I: IndexType>(
    tri1: &InternalTriangle<I>,
    tri2: &InternalTriangle<I>,
    shared_v1: I,
    shared_v2: I,
    v_tri1: I,
    v_tri2: I,
) -> EdgeNeighbors<I> {
    let mut tri1_neighbor_at_v1: Option<I> = None;
    let mut tri1_neighbor_at_v2: Option<I> = None;
    let mut tri2_neighbor_at_v1: Option<I> = None;
    let mut tri2_neighbor_at_v2: Option<I> = None;

    // Find neighbors in tri1
    for i in 0..3 {
        let edge_start = tri1.vertices[(i + 1) % 3];
        let edge_end = tri1.vertices[(i + 2) % 3];

        if (edge_start == v_tri1 && edge_end == shared_v1)
            || (edge_start == shared_v1 && edge_end == v_tri1)
        {
            tri1_neighbor_at_v2 = tri1.neighbors[i];
        }
        if (edge_start == v_tri1 && edge_end == shared_v2)
            || (edge_start == shared_v2 && edge_end == v_tri1)
        {
            tri1_neighbor_at_v1 = tri1.neighbors[i];
        }
    }

    // Find neighbors in tri2
    for i in 0..3 {
        let edge_start = tri2.vertices[(i + 1) % 3];
        let edge_end = tri2.vertices[(i + 2) % 3];

        if (edge_start == v_tri2 && edge_end == shared_v1)
            || (edge_start == shared_v1 && edge_end == v_tri2)
        {
            tri2_neighbor_at_v2 = tri2.neighbors[i];
        }
        if (edge_start == v_tri2 && edge_end == shared_v2)
            || (edge_start == shared_v2 && edge_end == v_tri2)
        {
            tri2_neighbor_at_v1 = tri2.neighbors[i];
        }
    }

    EdgeNeighbors {
        tri1_at_v1: tri1_neighbor_at_v1,
        tri1_at_v2: tri1_neighbor_at_v2,
        tri2_at_v1: tri2_neighbor_at_v1,
        tri2_at_v2: tri2_neighbor_at_v2,
    }
}

/// Updates a neighbor's pointer from old triangle to new triangle.
fn update_neighbor_pointer<C: CoordType, I: IndexType>(
    triang: &mut InternalTriangulation<C, I>,
    neighbor_id: Option<I>,
    old_tri1: I,
    old_tri2: I,
    new_tri: I,
) {
    if let Some(nid) = neighbor_id {
        if let Some(Some(neighbor)) = triang.triangles.get_mut(nid.to_usize()) {
            for i in 0..3 {
                if neighbor.neighbors[i] == Some(old_tri1)
                    || neighbor.neighbors[i] == Some(old_tri2)
                {
                    neighbor.neighbors[i] = Some(new_tri);
                    break;
                }
            }
        }
    }
}
