//! Types for internal triangulation representation.
//!
//! This module contains the core data structures used during triangulation construction:
//! - `InternalTriangle` - represents a single triangle with vertices and neighbors
//! - `InternalTriangulation` - represents the complete triangulation state

mod internal_triangle;
mod internal_triangulation;

pub(crate) use internal_triangle::InternalTriangle;
pub use internal_triangulation::InternalTriangulation;

// Re-export TriangulatorConfig from config module for backwards compatibility
pub use super::config::TriangulatorConfig;
