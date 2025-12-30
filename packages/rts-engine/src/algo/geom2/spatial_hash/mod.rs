mod cell;
mod client;
mod config;
mod coord;
mod error;
mod insertable;
mod query;
mod registry;

#[cfg(test)]
mod tests;

pub use client::{Client, ClientHandle, ClientMut};
pub use config::{OutOfBoundsBehavior, SpatialHashMapConfig};
pub use coord::SpatialHashMapCoord;
pub use error::SpatialHashMapError;
pub use insertable::{Aabb, PointOrSegment, SpatialHashMapShape, SpatialHashMapSpec};
pub use query::SpatialHashMapQuery;
pub use registry::SpatialHashMap;
