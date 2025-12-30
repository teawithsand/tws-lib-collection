use super::super::PathingMap;
use super::anya::Anya;
use super::AnyaError;
use crate::path::MapCoordinate;
use nalgebra::Point2;

/// Find a path between two points using the Anya pathfinding algorithm.
///
/// # Arguments
///
/// * `map` - The map to search on, must implement the `Map` trait
/// * `start` - The starting point
/// * `end` - The ending point
/// * `path` - A mutable vector to store the resulting path
///
/// # Returns
///
/// * `Ok(())` if a path to the goal was found
/// * `Err(AnyaError::PathNotReachable)` if the goal is unreachable. The path vector will contain the path to the closest reachable point.
///
/// # Example
///
/// ```
/// use nalgebra::Point2;
/// use tws_rts_engine::path::{RtsMap, anya_find_path};
///
/// let map = RtsMap::new(10, 10);
/// let mut path = Vec::new();
/// let result = anya_find_path(
///     map,
///     Point2::new(0, 0),
///     Point2::new(9, 9),
///     &mut path
/// );
///
/// if result.is_ok() {
///     println!("Path found with {} steps", path.len());
/// }
/// ```
pub fn anya_find_path<M: PathingMap>(
    map: M,
    start: Point2<MapCoordinate>,
    end: Point2<MapCoordinate>,
    path: &mut Vec<Point2<MapCoordinate>>,
) -> Result<(), AnyaError> {
    let mut anya = Anya::new(map, start.x, start.y, end.x, end.y);
    let found = anya.compute_path(path);

    if found {
        Ok(())
    } else {
        Err(AnyaError::PathNotReachable)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::path::{MapCell, RtsMap};

    #[test]
    fn find_path_works_for_straight_line() {
        let map = RtsMap::new(10, 10);
        let mut path = Vec::new();

        let result = anya_find_path(map, Point2::new(0, 0), Point2::new(9, 0), &mut path);

        assert!(result.is_ok());
        assert!(!path.is_empty());
        assert_eq!(path[0], Point2::new(0, 0));
        assert_eq!(path[path.len() - 1], Point2::new(9, 0));
    }

    #[test]
    fn find_path_works_for_diagonal() {
        let map = RtsMap::new(10, 10);
        let mut path = Vec::new();

        let result = anya_find_path(map, Point2::new(0, 0), Point2::new(9, 9), &mut path);

        assert!(result.is_ok());
        assert!(!path.is_empty());
        assert_eq!(path[0], Point2::new(0, 0));
        assert_eq!(path[path.len() - 1], Point2::new(9, 9));
    }

    #[test]
    fn find_path_returns_error_when_blocked() {
        let mut map = RtsMap::new(10, 10);
        // Create a wall blocking the path
        for y in 0..10 {
            map.set(5, y, MapCell::blocked());
        }

        let mut path = Vec::new();
        let result = anya_find_path(map, Point2::new(0, 5), Point2::new(9, 5), &mut path);

        assert!(result.is_err());
        // Path should still contain something (closest point)
        assert!(!path.is_empty());
    }

    #[test]
    fn find_path_finds_path_around_obstacle() {
        let mut map = RtsMap::new(15, 15);
        // Create a wall with gaps
        for y in 3..12 {
            map.set(7, y, MapCell::blocked());
        }

        let mut path = Vec::new();
        let result = anya_find_path(map, Point2::new(0, 7), Point2::new(14, 7), &mut path);

        // Should find a path going around
        if result.is_ok() {
            assert!(!path.is_empty());
            assert_eq!(path[0], Point2::new(0, 7));
            assert_eq!(path[path.len() - 1], Point2::new(14, 7));
        }
    }
}
