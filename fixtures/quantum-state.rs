use std::fmt::Debug;

pub const DIMENSION: usize = 2;

pub struct QuantumState<'a> {
    amplitudes: &'a [f64],
}

impl<'a> QuantumState<'a> {
    pub fn new(amplitudes: &'a [f64]) -> Self {
        Self { amplitudes }
    }

    pub fn dimension(&self) -> usize {
        self.amplitudes.len()
    }
}