use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TriangulationError {
    ArithmeticOverflow { operation: &'static str },

    InvalidInput { message: String },

    InternalError { message: String },
}

impl fmt::Display for TriangulationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TriangulationError::ArithmeticOverflow { operation } => {
                write!(f, "Arithmetic overflow in operation: {}", operation)
            }
            TriangulationError::InvalidInput { message } => {
                write!(f, "Invalid input: {}", message)
            }
            TriangulationError::InternalError { message } => {
                write!(f, "Internal error: {}", message)
            }
        }
    }
}

impl std::error::Error for TriangulationError {}
