use super::error::TriangulationError;
use super::geometry::{is_convex_quad, segments_intersect_proper};
use super::traits::{CoordType, IndexType};
use super::types::{InternalTriangle, InternalTriangulation};

pub fn enforce_constraint<C: CoordType, I: IndexType>(
    triang: &mut InternalTriangulation<C, I>,
    v1: I,
    v2: I,
) -> Result<(), TriangulationError> {
    if triang.triangles_for_edge(v1, v2).next().is_some() {
        return Ok(());
    }

    let mut intersecting: Vec<(I, I)> = intersecting_edges(triang, v1, v2)?.collect();

    while !intersecting.is_empty() {
        let (edge_v1, edge_v2) = intersecting.remove(0);

        let triangles: Vec<_> = triang.triangles_for_edge(edge_v1, edge_v2).collect();

        if triangles.len() != 2 {
            continue;
        }

        let tri1_id = triangles[0];
        let tri2_id = triangles[1];

        let (q1, q2, q3, q4) = triang.get_quadrilateral(tri1_id, tri2_id)?;

        let quad_points = [
            triang.points[q1.to_usize()],
            triang.points[q2.to_usize()],
            triang.points[q3.to_usize()],
            triang.points[q4.to_usize()],
        ];

        if !is_convex_quad(
            quad_points[0],
            quad_points[1],
            quad_points[2],
            quad_points[3],
        )? {
            return Err(TriangulationError::InternalError {
                message: format!(
                    "Cannot flip edge ({:?}, {:?}) - quadrilateral is not convex",
                    edge_v1, edge_v2
                ),
            });
        }

        flip_edge_unchecked(triang, tri1_id, tri2_id, edge_v1, edge_v2, q2, q4)?;

        let p1 = triang.points[v1.to_usize()];
        let p2 = triang.points[v2.to_usize()];
        let new_diag_p1 = triang.points[q2.to_usize()];
        let new_diag_p2 = triang.points[q4.to_usize()];

        if segments_intersect_proper(p1, p2, new_diag_p1, new_diag_p2)? {
            intersecting.push((q2, q4));
        }

        intersecting.retain(|&(iv1, iv2)| triang.triangles_for_edge(iv1, iv2).count() == 2);
    }

    Ok(())
}

pub fn intersecting_edges<C: CoordType, I: IndexType>(
    triang: &InternalTriangulation<C, I>,
    v1: I,
    v2: I,
) -> Result<impl Iterator<Item = (I, I)> + '_, TriangulationError> {
    let p1 = triang.points[v1.to_usize()];
    let p2 = triang.points[v2.to_usize()];

    let mut intersecting = Vec::new();

    for opt_tri in &triang.triangles {
        let tri = match opt_tri {
            Some(t) => t,
            None => continue,
        };

        for i in 0..3 {
            let edge_v1 = tri.vertices[i];
            let edge_v2 = tri.vertices[(i + 1) % 3];

            if edge_v1 == v1 || edge_v1 == v2 || edge_v2 == v1 || edge_v2 == v2 {
                continue;
            }

            let edge_p1 = triang.points[edge_v1.to_usize()];
            let edge_p2 = triang.points[edge_v2.to_usize()];

            if segments_intersect_proper(p1, p2, edge_p1, edge_p2)? {
                let edge = if edge_v1 < edge_v2 {
                    (edge_v1, edge_v2)
                } else {
                    (edge_v2, edge_v1)
                };

                if !intersecting.contains(&edge) {
                    intersecting.push(edge);
                }
            }
        }
    }

    Ok(intersecting.into_iter())
}

fn flip_edge_unchecked<C: CoordType, I: IndexType>(
    triang: &mut InternalTriangulation<C, I>,
    tri1_id: I,
    tri2_id: I,
    shared_v1: I,
    shared_v2: I,
    v_tri1: I,
    v_tri2: I,
) -> Result<(), TriangulationError> {
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

    let mut tri1_neighbor_at_shared_v1: Option<I> = None;
    let mut tri1_neighbor_at_shared_v2: Option<I> = None;
    let mut tri2_neighbor_at_shared_v1: Option<I> = None;
    let mut tri2_neighbor_at_shared_v2: Option<I> = None;

    for i in 0..3 {
        let edge_start = tri1.vertices[(i + 1) % 3];
        let edge_end = tri1.vertices[(i + 2) % 3];

        if (edge_start == v_tri1 && edge_end == shared_v1)
            || (edge_start == shared_v1 && edge_end == v_tri1)
        {
            tri1_neighbor_at_shared_v2 = tri1.neighbors[i];
        }
        if (edge_start == v_tri1 && edge_end == shared_v2)
            || (edge_start == shared_v2 && edge_end == v_tri1)
        {
            tri1_neighbor_at_shared_v1 = tri1.neighbors[i];
        }
    }

    for i in 0..3 {
        let edge_start = tri2.vertices[(i + 1) % 3];
        let edge_end = tri2.vertices[(i + 2) % 3];

        if (edge_start == v_tri2 && edge_end == shared_v1)
            || (edge_start == shared_v1 && edge_end == v_tri2)
        {
            tri2_neighbor_at_shared_v2 = tri2.neighbors[i];
        }
        if (edge_start == v_tri2 && edge_end == shared_v2)
            || (edge_start == shared_v2 && edge_end == v_tri2)
        {
            tri2_neighbor_at_shared_v1 = tri2.neighbors[i];
        }
    }

    triang.triangles[tri1_id.to_usize()] = None;
    triang.triangles[tri2_id.to_usize()] = None;

    let mut new_tri1 = InternalTriangle::new(v_tri1, shared_v1, v_tri2);
    let mut new_tri2 = InternalTriangle::new(v_tri1, v_tri2, shared_v2);

    let new_tri1_id =
        I::from_usize(triang.triangles.len()).ok_or_else(|| TriangulationError::InternalError {
            message: "Triangle index overflow".to_string(),
        })?;
    let new_tri2_id = I::from_usize(triang.triangles.len() + 1).ok_or_else(|| {
        TriangulationError::InternalError {
            message: "Triangle index overflow".to_string(),
        }
    })?;

    new_tri1.neighbors[0] = tri2_neighbor_at_shared_v2;
    new_tri1.neighbors[1] = Some(new_tri2_id);
    new_tri1.neighbors[2] = tri1_neighbor_at_shared_v2;

    new_tri2.neighbors[0] = tri2_neighbor_at_shared_v1;
    new_tri2.neighbors[1] = tri1_neighbor_at_shared_v1;
    new_tri2.neighbors[2] = Some(new_tri1_id);

    triang.triangles.push(Some(new_tri1));
    triang.triangles.push(Some(new_tri2));

    update_neighbor_pointer(
        triang,
        tri2_neighbor_at_shared_v2,
        tri1_id,
        tri2_id,
        new_tri1_id,
    );
    update_neighbor_pointer(
        triang,
        tri1_neighbor_at_shared_v2,
        tri1_id,
        tri2_id,
        new_tri1_id,
    );
    update_neighbor_pointer(
        triang,
        tri2_neighbor_at_shared_v1,
        tri1_id,
        tri2_id,
        new_tri2_id,
    );
    update_neighbor_pointer(
        triang,
        tri1_neighbor_at_shared_v1,
        tri1_id,
        tri2_id,
        new_tri2_id,
    );

    Ok(())
}

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
