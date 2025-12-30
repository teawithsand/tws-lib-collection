use super::cell::MapCell;

pub type MapCoordinate = i32;

pub trait Map {
    fn width(&self) -> MapCoordinate;
    fn height(&self) -> MapCoordinate;
    fn get(&self, x: MapCoordinate, y: MapCoordinate) -> Option<MapCell>;
}

pub trait MapMut: Map {
    fn set(&mut self, x: MapCoordinate, y: MapCoordinate, cell: MapCell) -> bool;
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestMap {
        width: MapCoordinate,
        height: MapCoordinate,
        cells: Vec<MapCell>,
    }

    impl TestMap {
        fn new(width: MapCoordinate, height: MapCoordinate) -> Self {
            let size = (width * height) as usize;
            Self {
                width,
                height,
                cells: vec![MapCell::pathable(); size],
            }
        }
    }

    impl Map for TestMap {
        fn width(&self) -> MapCoordinate {
            self.width
        }

        fn height(&self) -> MapCoordinate {
            self.height
        }

        fn get(&self, x: MapCoordinate, y: MapCoordinate) -> Option<MapCell> {
            if x < 0 || y < 0 || x >= self.width || y >= self.height {
                return None;
            }
            let idx = (y * self.width + x) as usize;
            Some(self.cells[idx])
        }
    }

    impl MapMut for TestMap {
        fn set(&mut self, x: MapCoordinate, y: MapCoordinate, cell: MapCell) -> bool {
            if x < 0 || y < 0 || x >= self.width || y >= self.height {
                return false;
            }
            let idx = (y * self.width + x) as usize;
            self.cells[idx] = cell;
            true
        }
    }

    #[test]
    fn map_trait_provides_dimensions() {
        let map = TestMap::new(10, 5);
        assert_eq!(map.width(), 10);
        assert_eq!(map.height(), 5);
    }

    #[test]
    fn map_trait_get_returns_cells() {
        let map = TestMap::new(3, 3);
        assert_eq!(map.get(0, 0), Some(MapCell::pathable()));
        assert_eq!(map.get(2, 2), Some(MapCell::pathable()));
    }

    #[test]
    fn map_trait_get_handles_out_of_bounds() {
        let map = TestMap::new(3, 3);
        assert_eq!(map.get(-1, 0), None);
        assert_eq!(map.get(0, -1), None);
        assert_eq!(map.get(3, 0), None);
        assert_eq!(map.get(0, 3), None);
    }

    #[test]
    fn map_mut_trait_sets_cells() {
        let mut map = TestMap::new(3, 3);
        assert!(map.set(1, 1, MapCell::blocked()));
        assert_eq!(map.get(1, 1), Some(MapCell::blocked()));
    }

    #[test]
    fn map_mut_trait_rejects_out_of_bounds() {
        let mut map = TestMap::new(3, 3);
        assert!(!map.set(-1, 0, MapCell::blocked()));
        assert!(!map.set(3, 0, MapCell::blocked()));
    }
}
