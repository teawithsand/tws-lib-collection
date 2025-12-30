use crate::algo::geom2::spatial_hash::query::SpatialHashMapQuery;
use crate::algo::geom2::spatial_hash::SpatialHashMapCoord;
use crate::algo::geom2::Segment2;
use nalgebra::Point2;

mod point2;
mod segment2;

/// Axis-aligned bounding box in world coordinates.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Aabb<C: nalgebra::Scalar> {
    pub min: Point2<C>,
    pub max: Point2<C>,
}

pub trait SpatialHashMapShape<C>
where
    C: nalgebra::Scalar,
{
    fn get_intersecting_cells<'a>(
        &'a self,
        map_spec: SpatialHashMapSpec<C>,
    ) -> impl Iterator<Item = (C, C)> + 'a;

    fn matches_query(&self, query: &SpatialHashMapQuery<C>) -> bool;

    /// Returns the axis-aligned bounding box of this shape in world coordinates.
    fn aabb(&self) -> Aabb<C>;
}

#[derive(Debug, Clone, Copy)]
pub struct SpatialHashMapSpec<C> {
    pub cell_width: C,
    pub cell_height: C,
}

/// A shape that can be either a Point2 or a Segment2.
///
/// This enum provides a convenient way to store heterogeneous shapes
/// in a single SpatialHashMap.
#[derive(Debug, Clone)]
pub enum PointOrSegment<C>
where
    C: nalgebra::Scalar,
{
    Point(Point2<C>),
    Segment(Segment2<C>),
}

impl<C> SpatialHashMapShape<C> for PointOrSegment<C>
where
    C: SpatialHashMapCoord
        + nalgebra::Scalar
        + PartialOrd
        + std::ops::Sub<Output = C>
        + std::ops::Mul<Output = C>
        + std::ops::Add<Output = C>
        + std::ops::Div<Output = C>
        + From<u8>,
{
    fn get_intersecting_cells<'a>(
        &'a self,
        map_spec: SpatialHashMapSpec<C>,
    ) -> impl Iterator<Item = (C, C)> + 'a {
        match self {
            PointOrSegment::Point(p) => Box::new(p.get_intersecting_cells(map_spec))
                as Box<dyn Iterator<Item = (C, C)> + 'a>,
            PointOrSegment::Segment(s) => Box::new(s.get_intersecting_cells(map_spec))
                as Box<dyn Iterator<Item = (C, C)> + 'a>,
        }
    }

    fn matches_query(&self, query: &SpatialHashMapQuery<C>) -> bool {
        match self {
            PointOrSegment::Point(p) => p.matches_query(query),
            PointOrSegment::Segment(s) => s.matches_query(query),
        }
    }

    fn aabb(&self) -> Aabb<C> {
        match self {
            PointOrSegment::Point(p) => p.aabb(),
            PointOrSegment::Segment(s) => s.aabb(),
        }
    }
}
