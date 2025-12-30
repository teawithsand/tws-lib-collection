mod config;
mod delaunay_builder;
mod delaunay_constrain;
mod delaunay_edge_flip;
mod delaunay_point_insertion;
mod delaunay_supertriangle;
mod delaunay_validation;
mod error;
#[cfg(fuzzing)]
pub mod geometry;
#[cfg(not(fuzzing))]
pub(crate) mod geometry;
mod traits;
mod triangulation_public;
mod types;

pub use self::config::TriangulatorConfig;
pub use self::delaunay_builder::Triangulator;
pub use self::error::TriangulationError;
pub use self::triangulation_public::{Triangulation, TriangulationTriangle};
