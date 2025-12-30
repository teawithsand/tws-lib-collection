use nalgebra::Point2;

use super::error::TriangulationError;
use super::traits::{CoordType, MathType};

pub fn orientation<C: CoordType>(
    p1: Point2<C>,
    p2: Point2<C>,
    p3: Point2<C>,
) -> Result<C::Math, TriangulationError> {
    let dx1 = p2.x.to_math().checked_sub(p1.x.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "orientation: p2.x - p1.x",
        },
    )?;

    let dy1 = p3.y.to_math().checked_sub(p1.y.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "orientation: p3.y - p1.y",
        },
    )?;

    let dx2 = p3.x.to_math().checked_sub(p1.x.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "orientation: p3.x - p1.x",
        },
    )?;

    let dy2 = p2.y.to_math().checked_sub(p1.y.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "orientation: p2.y - p1.y",
        },
    )?;

    let term1 = dx1
        .checked_mul(dy1)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "orientation: dx1 * dy1",
        })?;

    let term2 = dx2
        .checked_mul(dy2)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "orientation: dx2 * dy2",
        })?;

    term1
        .checked_sub(term2)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "orientation: term1 - term2",
        })
}

/// Check if point `p` lies on the line segment from `seg_start` to `seg_end`.
///
/// Returns true if:
/// 1. The three points are collinear (orientation == 0), AND
/// 2. Point `p` is between `seg_start` and `seg_end` (bounding box check)
///
/// Note: Returns false if `p` equals `seg_start` or `seg_end` (endpoints).
pub fn point_on_segment<C: CoordType>(
    p: Point2<C>,
    seg_start: Point2<C>,
    seg_end: Point2<C>,
) -> Result<bool, TriangulationError> {
    // First check collinearity
    let orient = orientation(seg_start, seg_end, p)?;
    if orient != C::Math::zero() {
        return Ok(false);
    }

    // Check if p equals either endpoint
    if (p.x == seg_start.x && p.y == seg_start.y) || (p.x == seg_end.x && p.y == seg_end.y) {
        return Ok(false);
    }

    // Check if p is within the bounding box of the segment
    let min_x = if seg_start.x < seg_end.x {
        seg_start.x
    } else {
        seg_end.x
    };
    let max_x = if seg_start.x > seg_end.x {
        seg_start.x
    } else {
        seg_end.x
    };
    let min_y = if seg_start.y < seg_end.y {
        seg_start.y
    } else {
        seg_end.y
    };
    let max_y = if seg_start.y > seg_end.y {
        seg_start.y
    } else {
        seg_end.y
    };

    Ok(p.x >= min_x && p.x <= max_x && p.y >= min_y && p.y <= max_y)
}

/// Test if point d is inside the circumcircle of triangle (a, b, c).
///
/// Returns the determinant value:
/// - Positive: d is inside the circumcircle
/// - Zero: d is on the circumcircle
/// - Negative: d is outside the circumcircle
///
/// Uses the determinant formula from the JS implementation:
/// (ax² + ay²)(bx·cy - cx·by) - (bx² + by²)(ax·cy - cx·ay) + (cx² + cy²)(ax·by - bx·ay)
/// where all coordinates are relative to d.
pub fn in_circumcircle_det<C: CoordType>(
    a: Point2<C>,
    b: Point2<C>,
    c: Point2<C>,
    d: Point2<C>,
) -> Result<C::Math, TriangulationError> {
    // Translate all points relative to d
    let ax =
        a.x.to_math()
            .checked_sub(d.x.to_math())
            .ok_or(TriangulationError::ArithmeticOverflow {
                operation: "circumcircle: a.x - d.x",
            })?;
    let ay =
        a.y.to_math()
            .checked_sub(d.y.to_math())
            .ok_or(TriangulationError::ArithmeticOverflow {
                operation: "circumcircle: a.y - d.y",
            })?;

    let bx =
        b.x.to_math()
            .checked_sub(d.x.to_math())
            .ok_or(TriangulationError::ArithmeticOverflow {
                operation: "circumcircle: b.x - d.x",
            })?;
    let by =
        b.y.to_math()
            .checked_sub(d.y.to_math())
            .ok_or(TriangulationError::ArithmeticOverflow {
                operation: "circumcircle: b.y - d.y",
            })?;

    let cx =
        c.x.to_math()
            .checked_sub(d.x.to_math())
            .ok_or(TriangulationError::ArithmeticOverflow {
                operation: "circumcircle: c.x - d.x",
            })?;
    let cy =
        c.y.to_math()
            .checked_sub(d.y.to_math())
            .ok_or(TriangulationError::ArithmeticOverflow {
                operation: "circumcircle: c.y - d.y",
            })?;

    // Compute squared terms: ax² + ay²
    let ax_sq = ax
        .checked_mul(ax)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: ax²",
        })?;
    let ay_sq = ay
        .checked_mul(ay)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: ay²",
        })?;
    let a_sq_sum = ax_sq
        .checked_add(ay_sq)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: ax² + ay²",
        })?;

    let bx_sq = bx
        .checked_mul(bx)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: bx²",
        })?;
    let by_sq = by
        .checked_mul(by)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: by²",
        })?;
    let b_sq_sum = bx_sq
        .checked_add(by_sq)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: bx² + by²",
        })?;

    let cx_sq = cx
        .checked_mul(cx)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: cx²",
        })?;
    let cy_sq = cy
        .checked_mul(cy)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: cy²",
        })?;
    let c_sq_sum = cx_sq
        .checked_add(cy_sq)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: cx² + cy²",
        })?;

    // Compute cross products
    let bx_cy = bx
        .checked_mul(cy)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: bx * cy",
        })?;
    let cx_by = cx
        .checked_mul(by)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: cx * by",
        })?;
    let cross1 = bx_cy
        .checked_sub(cx_by)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: bx*cy - cx*by",
        })?;

    let ax_cy = ax
        .checked_mul(cy)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: ax * cy",
        })?;
    let cx_ay = cx
        .checked_mul(ay)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: cx * ay",
        })?;
    let cross2 = ax_cy
        .checked_sub(cx_ay)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: ax*cy - cx*ay",
        })?;

    let ax_by = ax
        .checked_mul(by)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: ax * by",
        })?;
    let bx_ay = bx
        .checked_mul(ay)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: bx * ay",
        })?;
    let cross3 = ax_by
        .checked_sub(bx_ay)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: ax*by - bx*ay",
        })?;

    // Compute final determinant
    let term1 = a_sq_sum
        .checked_mul(cross1)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: a_sq_sum * cross1",
        })?;

    let term2 = b_sq_sum
        .checked_mul(cross2)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: b_sq_sum * cross2",
        })?;

    let term3 = c_sq_sum
        .checked_mul(cross3)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: c_sq_sum * cross3",
        })?;

    let result = term1
        .checked_sub(term2)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: term1 - term2",
        })?
        .checked_add(term3)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "circumcircle: result + term3",
        })?;

    Ok(result)
}

/// Check if a point is inside a triangle.
///
/// Uses the orientation test on all three edges.
/// A point is inside if it has the same orientation relative to all three edges.
pub fn point_in_triangle<C: CoordType>(
    tri_vertices: [Point2<C>; 3],
    point: Point2<C>,
) -> Result<bool, TriangulationError> {
    let d1 = orientation(point, tri_vertices[0], tri_vertices[1])?;
    let d2 = orientation(point, tri_vertices[1], tri_vertices[2])?;
    let d3 = orientation(point, tri_vertices[2], tri_vertices[0])?;

    // Point is inside if all signs are the same (all <= 0 or all >= 0)
    let has_neg = d1 < C::Math::zero() || d2 < C::Math::zero() || d3 < C::Math::zero();
    let has_pos = d1 > C::Math::zero() || d2 > C::Math::zero() || d3 > C::Math::zero();

    Ok(!(has_neg && has_pos))
}

/// Check if a point is strictly inside a triangle (not on boundary).
///
/// A point is strictly inside if it has the same non-zero orientation relative to all three edges.
pub fn point_strictly_in_triangle<C: CoordType>(
    tri_vertices: [Point2<C>; 3],
    point: Point2<C>,
) -> Result<bool, TriangulationError> {
    let d1 = orientation(point, tri_vertices[0], tri_vertices[1])?;
    let d2 = orientation(point, tri_vertices[1], tri_vertices[2])?;
    let d3 = orientation(point, tri_vertices[2], tri_vertices[0])?;

    // Point is strictly inside if all orientations have the same sign AND none are zero
    let all_neg = d1 < C::Math::zero() && d2 < C::Math::zero() && d3 < C::Math::zero();
    let all_pos = d1 > C::Math::zero() && d2 > C::Math::zero() && d3 > C::Math::zero();

    Ok(all_neg || all_pos)
}

/// Check if four points form a convex quadrilateral.
///
/// A quadrilateral is convex if all four cross products of adjacent edges
/// have the same sign (all positive or all negative).
pub fn is_convex_quad<C: CoordType>(
    p1: Point2<C>,
    p2: Point2<C>,
    p3: Point2<C>,
    p4: Point2<C>,
) -> Result<bool, TriangulationError> {
    // Compute edge vectors
    let ab_x = p2.x.to_math().checked_sub(p1.x.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: p2.x - p1.x",
        },
    )?;
    let ab_y = p2.y.to_math().checked_sub(p1.y.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: p2.y - p1.y",
        },
    )?;

    let bc_x = p3.x.to_math().checked_sub(p2.x.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: p3.x - p2.x",
        },
    )?;
    let bc_y = p3.y.to_math().checked_sub(p2.y.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: p3.y - p2.y",
        },
    )?;

    let cd_x = p4.x.to_math().checked_sub(p3.x.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: p4.x - p3.x",
        },
    )?;
    let cd_y = p4.y.to_math().checked_sub(p3.y.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: p4.y - p3.y",
        },
    )?;

    let da_x = p1.x.to_math().checked_sub(p4.x.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: p1.x - p4.x",
        },
    )?;
    let da_y = p1.y.to_math().checked_sub(p4.y.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: p1.y - p4.y",
        },
    )?;

    // Compute cross products
    let cross_ab_bc = ab_x
        .checked_mul(bc_y)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: ab_x * bc_y",
        })?
        .checked_sub(
            ab_y.checked_mul(bc_x)
                .ok_or(TriangulationError::ArithmeticOverflow {
                    operation: "convex_quad: ab_y * bc_x",
                })?,
        )
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: cross_ab_bc",
        })?;

    let cross_bc_cd = bc_x
        .checked_mul(cd_y)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: bc_x * cd_y",
        })?
        .checked_sub(
            bc_y.checked_mul(cd_x)
                .ok_or(TriangulationError::ArithmeticOverflow {
                    operation: "convex_quad: bc_y * cd_x",
                })?,
        )
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: cross_bc_cd",
        })?;

    let cross_cd_da = cd_x
        .checked_mul(da_y)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: cd_x * da_y",
        })?
        .checked_sub(
            cd_y.checked_mul(da_x)
                .ok_or(TriangulationError::ArithmeticOverflow {
                    operation: "convex_quad: cd_y * da_x",
                })?,
        )
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: cross_cd_da",
        })?;

    let cross_da_ab = da_x
        .checked_mul(ab_y)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: da_x * ab_y",
        })?
        .checked_sub(
            da_y.checked_mul(ab_x)
                .ok_or(TriangulationError::ArithmeticOverflow {
                    operation: "convex_quad: da_y * ab_x",
                })?,
        )
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "convex_quad: cross_da_ab",
        })?;

    // Convex if all same sign
    Ok((cross_ab_bc > C::Math::zero()
        && cross_bc_cd > C::Math::zero()
        && cross_cd_da > C::Math::zero()
        && cross_da_ab > C::Math::zero())
        || (cross_ab_bc < C::Math::zero()
            && cross_bc_cd < C::Math::zero()
            && cross_cd_da < C::Math::zero()
            && cross_da_ab < C::Math::zero()))
}

/// Check if two line segments properly intersect (cross in their interiors).
///
/// Segments (p1, p2) and (p3, p4) properly intersect if they cross in their
/// interiors, excluding endpoint touches.
pub fn segments_intersect_proper<C: CoordType>(
    p1: Point2<C>,
    p2: Point2<C>,
    p3: Point2<C>,
    p4: Point2<C>,
) -> Result<bool, TriangulationError> {
    let o1 = orientation(p1, p2, p3)?;
    let o2 = orientation(p1, p2, p4)?;
    let o3 = orientation(p3, p4, p1)?;
    let o4 = orientation(p3, p4, p2)?;

    // Proper intersection: endpoints are on opposite sides of each segment
    Ok((o1 > C::Math::zero() && o2 < C::Math::zero()
        || o1 < C::Math::zero() && o2 > C::Math::zero())
        && (o3 > C::Math::zero() && o4 < C::Math::zero()
            || o3 < C::Math::zero() && o4 > C::Math::zero()))
}
