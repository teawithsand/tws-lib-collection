use thiserror::Error;

/// Errors that can occur when operating on a spatial hash map.
#[derive(Error, Debug, Clone, PartialEq, Eq)]
pub enum SpatialHashMapError {
    /// A cell coordinate is out of bounds for the grid.
    #[error("cell coordinate is out of bounds for grid {cells_x}x{cells_y}")]
    OutOfBounds { cells_x: usize, cells_y: usize },
}
