use super::fraction::Fraction;
use crate::path::MapCoordinate;
use nalgebra::Point2;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct AnyaState {
    pub x_l: Fraction,
    pub x_r: Fraction,
    pub y: MapCoordinate,
    pub base_point: Point2<MapCoordinate>,
}

impl AnyaState {
    pub fn create_start_state(
        x_l: Fraction,
        x_r: Fraction,
        y: MapCoordinate,
        start: Point2<MapCoordinate>,
    ) -> StateWithCost {
        StateWithCost {
            state: Self {
                x_l,
                x_r,
                y,
                base_point: start,
            },
            g_value: 0.0,
            parent: None,
        }
    }

    pub fn create_observable_successor(
        x_l: Fraction,
        x_r: Fraction,
        y: MapCoordinate,
        source: &StateWithCost,
    ) -> StateWithCost {
        StateWithCost {
            state: Self {
                x_l,
                x_r,
                y,
                base_point: source.state.base_point,
            },
            g_value: source.g_value,
            parent: source.parent.clone(),
        }
    }

    pub fn create_unobservable_successor(
        x_l: Fraction,
        x_r: Fraction,
        y: MapCoordinate,
        base_point: Point2<MapCoordinate>,
        source: &StateWithCost,
    ) -> StateWithCost {
        let dx = (base_point.x - source.state.base_point.x) as f32;
        let dy = (base_point.y - source.state.base_point.y) as f32;
        let distance = (dx * dx + dy * dy).sqrt();

        StateWithCost {
            state: Self {
                x_l,
                x_r,
                y,
                base_point,
            },
            g_value: source.g_value + distance,
            parent: Some(Box::new(source.clone())),
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct StateWithCost {
    pub state: AnyaState,
    pub g_value: f32,
    pub parent: Option<Box<StateWithCost>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_start_state_has_zero_cost() {
        let state = AnyaState::create_start_state(
            Fraction::from_int(0),
            Fraction::from_int(5),
            0,
            Point2::new(0, 0),
        );
        assert_eq!(state.g_value, 0.0);
        assert!(state.parent.is_none());
    }

    #[test]
    fn observable_successor_shares_base_point() {
        let start = AnyaState::create_start_state(
            Fraction::from_int(0),
            Fraction::from_int(5),
            0,
            Point2::new(2, 2),
        );

        let successor = AnyaState::create_observable_successor(
            Fraction::from_int(3),
            Fraction::from_int(7),
            1,
            &start,
        );

        assert_eq!(successor.state.base_point, start.state.base_point);
        assert_eq!(successor.g_value, start.g_value);
    }

    #[test]
    fn unobservable_successor_updates_cost() {
        let start = AnyaState::create_start_state(
            Fraction::from_int(0),
            Fraction::from_int(5),
            0,
            Point2::new(0, 0),
        );

        let successor = AnyaState::create_unobservable_successor(
            Fraction::from_int(1),
            Fraction::from_int(4),
            5,
            Point2::new(3, 4),
            &start,
        );

        assert_eq!(successor.state.base_point, Point2::new(3, 4));
        assert!(successor.g_value > 0.0);
        assert_eq!(successor.g_value, 5.0);
    }
}
