use thiserror::Error;

#[derive(Debug, Error)]
pub enum AnyaError {
    #[error("Path not reachable to goal")]
    PathNotReachable,

    #[error("Start position ({x}, {y}) is blocked or invalid")]
    InvalidStartPosition { x: i32, y: i32 },

    #[error("Goal position ({x}, {y}) is blocked or invalid")]
    InvalidGoalPosition { x: i32, y: i32 },

    #[error(
        "Map bounds exceeded: position ({x}, {y}) is outside map dimensions ({width}x{height})"
    )]
    OutOfBounds {
        x: i32,
        y: i32,
        width: i32,
        height: i32,
    },
}
