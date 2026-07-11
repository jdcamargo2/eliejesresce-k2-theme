from __future__ import annotations

from dataclasses import dataclass
from math import pi

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector


@dataclass(frozen=True)
class Rotation:
    axis: str
    angle: float


class QuantumStateService:
    MAX_QUBITS = 8

    def __init__(self, qubits: int) -> None:
        if qubits <= 0:
            raise ValueError("qubits must be positive")

        self.qubits = qubits

    def create_bell_state(self) -> Statevector:
        circuit = QuantumCircuit(2)
        circuit.h(0)
        circuit.cx(0, 1)

        return Statevector.from_instruction(circuit)

    @staticmethod
    def rotate_y(angle: float = pi / 2) -> QuantumCircuit:
        circuit = QuantumCircuit(1)
        circuit.ry(angle, 0)
        return circuit