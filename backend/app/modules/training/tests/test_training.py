from app.modules.training.service import (
    calculate_completion_percentage,
    is_program_completed,
    validate_sequence,
)


def test_completion_percentage():
    assert calculate_completion_percentage(6, 10) == 60.0


def test_zero_total():
    assert calculate_completion_percentage(0, 0) == 0.0


def test_program_completed():
    assert is_program_completed(10, 10) is True


def test_program_not_completed():
    assert is_program_completed(5, 10) is False


def test_valid_sequence():
    assert validate_sequence(1) is True


def test_invalid_sequence():
    assert validate_sequence(0) is False