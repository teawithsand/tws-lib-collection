use super::anya::Anya;
use crate::path::{MapCell, MapCoordinate, RtsMap};

fn parse_java_predefined_grid(contents: &str) -> RtsMap {
    let mut parts = contents.split_whitespace();
    let width: MapCoordinate = parts.next().unwrap().parse().unwrap();
    let height: MapCoordinate = parts.next().unwrap().parse().unwrap();

    let mut map = RtsMap::new(width, height);
    for y in 0..height {
        for x in 0..width {
            if parts.next().unwrap().parse::<i32>().unwrap() != 0 {
                map.set(x, y, MapCell::blocked());
            }
        }
    }
    map
}

#[test]
fn custommaze2() {
    let map = parse_java_predefined_grid(include_str!("testcases/custommaze2.txt"));
    let width = map.width();
    let mut anya = Anya::new(map, 1, 3, width - 2, 3);
    let mut path = Vec::new();

    assert!(anya.compute_path(&mut path));
    assert!(!path.is_empty());
}

#[test]
fn line_of_sight_test() {
    let map = parse_java_predefined_grid(include_str!("testcases/lineOfSightTest.txt"));
    let mut anya = Anya::new(map, 14, 18, 0, 1);
    let mut path = Vec::new();

    anya.compute_path(&mut path);
    assert!(!path.is_empty());
}

#[test]
fn maze_theta_wcs() {
    let map = parse_java_predefined_grid(include_str!("testcases/mazeThetaWCS.txt"));
    let height = map.height();
    let mut anya = Anya::new(map, 0, 0, 0, height - 1);
    let mut path = Vec::new();

    anya.compute_path(&mut path);
    assert!(!path.is_empty());
}
