use std::hash::Hash;

use nalgebra::Point2;

use crate::path::MapCoordinate;

pub struct MapNavmeshNeighbor<H> {
    pub polygon_handle: H,
    pub desitnation_neighbor_edge_idx: usize,
}

pub trait PolygonHandle: Copy + Clone + PartialEq + Eq + Hash {}

pub trait MapNavmeshEdge {
    type PolygonHandle: PolygonHandle;

    /// Start point of the edge. Used interchangeably with `end()` of the previous edge except for iteration purposes.
    fn start(&self) -> Point2<MapCoordinate>;

    /// End point of the edge. Used interchangeably with `start()` of the next edge except for iteration purposes.
    fn end(&self) -> Point2<MapCoordinate>;

    /// Neighbor polygon on the other side of this edge, if any.
    ///
    /// Note that navmeshes should be cut in a way that allows having only one neighbor per edge.
    fn get_neighbor(&self) -> Option<MapNavmeshNeighbor<Self::PolygonHandle>>;
}

pub trait MapNameshPolygon {
    type PolygonHandle: PolygonHandle;
    type Edge: MapNavmeshEdge;

    /// Identifier of this polygon.
    fn id(&self) -> Self::PolygonHandle;

    /// How many edges does this polygon have?
    fn edges_count(&self) -> usize;

    /// Returns the edge at the given `index`, or `None` if `index` is out of range.
    ///
    /// Indices are in the range `0..edges_count()`. When iterating edges in order
    /// using consecutive indices, each edge's end point equals the next edge's
    /// start point: for all valid `i`, `edge(i).end() == edge(i + 1).start()`.
    /// This implies edges are contiguous and form the polygon boundary (assuming
    /// the polygon is closed).
    fn get_edge(&self, index: usize) -> Option<Self::Edge>;

    /// Checks if the polygon is pathable.
    fn is_pathable(&self) -> bool;
}

pub trait MapNavmesh {
    type PolygonHandle: PolygonHandle;
    type Polygon: MapNameshPolygon<PolygonHandle = Self::PolygonHandle>;

    fn get_polygon(&self, id: Self::PolygonHandle) -> Option<&Self::Polygon>;
    fn iter_polygons() -> impl Iterator<Item = Self::Polygon>;
}
