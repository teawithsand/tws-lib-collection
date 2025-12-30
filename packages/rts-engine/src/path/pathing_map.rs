use nalgebra::Point2;

use crate::path::MapCoordinate;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PathingMapCell {
    Pathable,
    Blocked,
    OutOfBounds,
}

impl PathingMapCell {
    pub fn is_pathable(&self) -> bool {
        return *self == PathingMapCell::Pathable;
    }
}

pub trait PathingMap {
    fn width(&self) -> MapCoordinate;
    fn height(&self) -> MapCoordinate;

    fn get_cell(&self, point: Point2<MapCoordinate>) -> PathingMapCell;
    fn get_cell_xy(&self, x: MapCoordinate, y: MapCoordinate) -> PathingMapCell {
        self.get_cell(Point2::new(x, y))
    }
}
