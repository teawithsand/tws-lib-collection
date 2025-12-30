use nalgebra::Point2;

use super::error::TriangulationError;
use super::traits::{CoordType, MathType};

/// Creates a supertriangle that contains all points in the bounding box.
///
/// The supertriangle is created with a heuristic margin of 10x the bounding box size
/// to ensure all points are strictly contained within it.
pub fn create_supertriangle_heur<C: CoordType>(
    min_x: C,
    min_y: C,
    max_x: C,
    max_y: C,
) -> Result<[Point2<C>; 3], TriangulationError> {
    let width = max_x.to_math().checked_sub(min_x.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "supertriangle: max_x - min_x",
        },
    )?;

    let height = max_y.to_math().checked_sub(min_y.to_math()).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "supertriangle: max_y - min_y",
        },
    )?;

    let margin_width =
        width
            .checked_mul(C::Math::from_i32(10))
            .ok_or(TriangulationError::ArithmeticOverflow {
                operation: "supertriangle: width * 10",
            })?;

    let margin_height = height.checked_mul(C::Math::from_i32(10)).ok_or(
        TriangulationError::ArithmeticOverflow {
            operation: "supertriangle: height * 10",
        },
    )?;

    let center_x = min_x
        .to_math()
        .checked_add(width.checked_div(C::Math::from_i32(2)).ok_or(
            TriangulationError::ArithmeticOverflow {
                operation: "supertriangle: width / 2",
            },
        )?)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "supertriangle: center_x",
        })?;

    let center_y = min_y
        .to_math()
        .checked_add(height.checked_div(C::Math::from_i32(2)).ok_or(
            TriangulationError::ArithmeticOverflow {
                operation: "supertriangle: height / 2",
            },
        )?)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "supertriangle: center_y",
        })?;

    let v0_x =
        center_x
            .checked_sub(margin_width)
            .ok_or(TriangulationError::ArithmeticOverflow {
                operation: "supertriangle: v0_x",
            })?;
    let v0_y = center_y
        .checked_sub(margin_height.checked_div(C::Math::from_i32(2)).ok_or(
            TriangulationError::ArithmeticOverflow {
                operation: "supertriangle: margin_height / 2",
            },
        )?)
        .ok_or(TriangulationError::ArithmeticOverflow {
            operation: "supertriangle: v0_y",
        })?;

    let v1_x =
        center_x
            .checked_add(margin_width)
            .ok_or(TriangulationError::ArithmeticOverflow {
                operation: "supertriangle: v1_x",
            })?;
    let v1_y = v0_y;

    let v2_x = center_x;
    let v2_y =
        center_y
            .checked_add(margin_height)
            .ok_or(TriangulationError::ArithmeticOverflow {
                operation: "supertriangle: v2_y",
            })?;

    let v0_x_coord = C::from_math(v0_x)?;
    let v0_y_coord = C::from_math(v0_y)?;
    let v1_x_coord = C::from_math(v1_x)?;
    let v1_y_coord = C::from_math(v1_y)?;
    let v2_x_coord = C::from_math(v2_x)?;
    let v2_y_coord = C::from_math(v2_y)?;

    Ok([
        Point2::new(v0_x_coord, v0_y_coord),
        Point2::new(v1_x_coord, v1_y_coord),
        Point2::new(v2_x_coord, v2_y_coord),
    ])
}
