use super::cell::MapCell;
use super::pathing_map::{PathingMap, PathingMapCell};
use super::traits::{Map, MapCoordinate, MapMut};
use nalgebra::Point2;

pub struct RtsMap {
    width: MapCoordinate,
    height: MapCoordinate,
    cells: Vec<MapCell>,
}

impl RtsMap {
    /// Create a new map with the given width and height.
    /// All cells are initialized as `PATHABLE`.
    pub fn new(width: MapCoordinate, height: MapCoordinate) -> Self {
        let len = (width as usize).checked_mul(height as usize).unwrap_or(0);
        let cells = vec![MapCell::pathable(); len];
        Self {
            width,
            height,
            cells,
        }
    }

    /// Returns the map width.
    pub fn width(&self) -> MapCoordinate {
        self.width
    }

    /// Returns the map height.
    pub fn height(&self) -> MapCoordinate {
        self.height
    }

    /// Internal helper to translate (x, y) to index in the 1D cell vector.
    fn idx(&self, x: MapCoordinate, y: MapCoordinate) -> Option<usize> {
        if x >= 0 && y >= 0 && x < self.width && y < self.height {
            Some((y as usize) * (self.width as usize) + (x as usize))
        } else {
            None
        }
    }

    /// Get the cell content at (x, y). Returns `None` if out of bounds.
    pub fn get(&self, x: MapCoordinate, y: MapCoordinate) -> Option<MapCell> {
        self.idx(x, y).map(|i| self.cells[i])
    }

    /// Set the cell content at (x, y). Returns `true` if set, `false` if out of bounds.
    pub fn set(&mut self, x: MapCoordinate, y: MapCoordinate, cell: MapCell) -> bool {
        if let Some(i) = self.idx(x, y) {
            self.cells[i] = cell;
            true
        } else {
            false
        }
    }

    /// Fill the entire map with a single value.
    pub fn fill(&mut self, cell: MapCell) {
        for c in &mut self.cells {
            *c = cell;
        }
    }

    /// Borrow the underlying cell slice.
    pub fn as_slice(&self) -> &[MapCell] {
        &self.cells
    }
}

impl Map for RtsMap {
    fn width(&self) -> MapCoordinate {
        self.width
    }

    fn height(&self) -> MapCoordinate {
        self.height
    }

    fn get(&self, x: MapCoordinate, y: MapCoordinate) -> Option<MapCell> {
        self.get(x, y)
    }
}

impl MapMut for RtsMap {
    fn set(&mut self, x: MapCoordinate, y: MapCoordinate, cell: MapCell) -> bool {
        self.set(x, y, cell)
    }
}

impl PathingMap for RtsMap {
    fn width(&self) -> MapCoordinate {
        self.width
    }

    fn height(&self) -> MapCoordinate {
        self.height
    }

    fn get_cell(&self, point: Point2<MapCoordinate>) -> PathingMapCell {
        match self.get(point.x, point.y) {
            Some(cell) => {
                if cell.is_pathable() {
                    PathingMapCell::Pathable
                } else {
                    PathingMapCell::Blocked
                }
            }
            None => PathingMapCell::OutOfBounds,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_map_has_correct_dims_and_default_values() {
        let m = RtsMap::new(3, 2);
        assert_eq!(m.width(), 3);
        assert_eq!(m.height(), 2);
        assert!(m.as_slice().iter().all(|c| c.is_pathable()));
    }

    #[test]
    fn get_and_set_work() {
        let mut m = RtsMap::new(2, 2);
        assert_eq!(m.get(0, 0), Some(MapCell::pathable()));
        assert_eq!(m.get(2, 0), None);

        let ok = m.set(1, 1, MapCell::blocked());
        assert!(ok);
        assert_eq!(m.get(1, 1), Some(MapCell::blocked()));

        let not_ok = m.set(5, 5, MapCell::blocked());
        assert!(!not_ok);
    }

    #[test]
    fn fill_sets_all_cells() {
        let mut m = RtsMap::new(4, 1);
        m.fill(MapCell::blocked());
        assert!(m.as_slice().iter().all(|c| c.is_blocked()));
    }

    #[test]
    fn negative_coordinates_return_none() {
        let m = RtsMap::new(5, 5);
        assert_eq!(m.get(-1, 0), None);
        assert_eq!(m.get(0, -1), None);
        assert_eq!(m.get(-1, -1), None);
    }

    #[test]
    fn map_trait_implementation_works() {
        let mut m = RtsMap::new(3, 3);
        let map_ref: &dyn Map = &m;
        assert_eq!(map_ref.width(), 3);
        assert_eq!(map_ref.height(), 3);
        assert_eq!(map_ref.get(0, 0), Some(MapCell::pathable()));

        let map_mut_ref: &mut dyn MapMut = &mut m;
        assert!(map_mut_ref.set(1, 1, MapCell::blocked()));
        assert_eq!(map_mut_ref.get(1, 1), Some(MapCell::blocked()));
    }
}
