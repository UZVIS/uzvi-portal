def calculate_completion_percentage(completed: int, total: int) -> float:
    """
    Calculate completion percentage.
    """

    if total <= 0:
        return 0.0

    return round((completed / total) * 100, 2)


def is_program_completed(completed: int, total: int) -> bool:
    """
    Check whether the employee finished the program.
    """

    return completed >= total and total > 0


def validate_sequence(sequence: int) -> bool:
    """
    Unit sequence must be greater than zero.
    """

    return sequence > 0