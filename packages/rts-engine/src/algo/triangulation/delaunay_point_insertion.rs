use nalgebra::Point2;

use super::delaunay_edge_flip::flip_edges_iterative;
use super::error::TriangulationError;
use super::geometry::point_in_triangle;
use super::traits::{CoordType, IndexType};
use super::types::{InternalTriangle, InternalTriangulation};

/// Inserts a point into the triangulation by finding the containing triangle,
/// splitting it, and restoring the Delaunay property through edge flipping.
pub fn insert_point<C: CoordType, I: IndexType>(
    triang: &mut InternalTriangulation<C, I>,
    point_idx: I,
) -> Result<(), TriangulationError> {
    let point = triang.points[point_idx.to_usize()];

    let containing_tri_id = find_triangle_containing_point(triang, point)?;

    let (tri0_id, tri1_id, tri2_id) = split_triangle(triang, containing_tri_id, point_idx)?;

    let mut edges_to_check: Vec<(I, I, I)> = Vec::new();

    for &tri_id in &[tri0_id, tri1_id, tri2_id] {
        if let Some(Some(tri)) = triang.triangles.get(tri_id.to_usize()) {
            if let Some(point_vert_idx) = tri.find_vertex_index(point_idx) {
                let v1 = tri.vertices[(point_vert_idx + 1) % 3];
                let v2 = tri.vertices[(point_vert_idx + 2) % 3];
                edges_to_check.push((v1, v2, tri_id));
            }
        }
    }

    flip_edges_iterative(triang, &mut edges_to_check)?;

    Ok(())
}

/// Finds the triangle that contains the given point.
fn find_triangle_containing_point<C: CoordType, I: IndexType>(
    triang: &InternalTriangulation<C, I>,
    point: Point2<C>,
) -> Result<I, TriangulationError> {
    for (i, opt_tri) in triang.triangles.iter().enumerate() {
        let tri = match opt_tri {
            Some(t) => t,
            None => continue,
        };

        let vertices = [
            triang.points[tri.vertices[0].to_usize()],
            triang.points[tri.vertices[1].to_usize()],
            triang.points[tri.vertices[2].to_usize()],
        ];

        if point_in_triangle(vertices, point)? {
            return Ok(I::from_usize(i).unwrap());
        }
    }

    Err(TriangulationError::InternalError {
        message: format!("No triangle contains point {:?}", point),
    })
}

/// Splits a triangle into three new triangles by inserting a point inside it.
///
/// The original triangle is marked inactive, and three new triangles are created,
/// each connecting the new point to one edge of the original triangle.
fn split_triangle<C: CoordType, I: IndexType>(
    triang: &mut InternalTriangulation<C, I>,
    tri_id: I,
    point_idx: I,
) -> Result<(I, I, I), TriangulationError> {
    let old_tri = triang.triangles[tri_id.to_usize()]
        .as_ref()
        .ok_or_else(|| TriangulationError::InternalError {
            message: "Triangle is inactive".to_string(),
        })?;
    let v0 = old_tri.vertices[0];
    let v1 = old_tri.vertices[1];
    let v2 = old_tri.vertices[2];
    let n0 = old_tri.neighbors[0];
    let n1 = old_tri.neighbors[1];
    let n2 = old_tri.neighbors[2];

    triang.triangles[tri_id.to_usize()] = None;

    let mut tri0 = InternalTriangle::new(point_idx, v0, v1);
    let mut tri1 = InternalTriangle::new(point_idx, v1, v2);
    let mut tri2 = InternalTriangle::new(point_idx, v2, v0);

    let tri0_id = I::from_usize(triang.triangles.len()).unwrap();
    let tri1_id = I::from_usize(triang.triangles.len() + 1).unwrap();
    let tri2_id = I::from_usize(triang.triangles.len() + 2).unwrap();

    tri0.set_neighbor(0, n2);
    tri0.set_neighbor(1, Some(tri1_id));
    tri0.set_neighbor(2, Some(tri2_id));

    tri1.set_neighbor(0, n0);
    tri1.set_neighbor(1, Some(tri2_id));
    tri1.set_neighbor(2, Some(tri0_id));

    tri2.set_neighbor(0, n1);
    tri2.set_neighbor(1, Some(tri0_id));
    tri2.set_neighbor(2, Some(tri1_id));

    update_external_neighbor(triang, n2, tri_id, tri0_id);
    update_external_neighbor(triang, n0, tri_id, tri1_id);
    update_external_neighbor(triang, n1, tri_id, tri2_id);

    triang.triangles.push(Some(tri0));
    triang.triangles.push(Some(tri1));
    triang.triangles.push(Some(tri2));

    Ok((tri0_id, tri1_id, tri2_id))
}

/// Updates an external neighbor to point to a new triangle instead of the old one.
fn update_external_neighbor<C: CoordType, I: IndexType>(
    triang: &mut InternalTriangulation<C, I>,
    neighbor_id: Option<I>,
    old_tri_id: I,
    new_tri_id: I,
) {
    if let Some(neighbor_id) = neighbor_id {
        if let Some(Some(neighbor)) = triang.triangles.get_mut(neighbor_id.to_usize()) {
            for i in 0..3 {
                if neighbor.neighbors[i] == Some(old_tri_id) {
                    neighbor.neighbors[i] = Some(new_tri_id);
                    break;
                }
            }
        }
    }
}
