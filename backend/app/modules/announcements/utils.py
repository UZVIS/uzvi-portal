from datetime import date


def is_expired(expiry_date):

    if expiry_date is None:
        return False

    return expiry_date < date.today()


def is_active(announcement):

    if announcement.archived:
        return False

    if announcement.expiry_date:

        if announcement.expiry_date < date.today():

            return False

    return True