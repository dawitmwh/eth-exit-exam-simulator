import threading

_thread_locals = threading.local()

def set_current_university(university):
    _thread_locals.university = university

def get_current_university():
    return getattr(_thread_locals, "university", None)

def clear_current_university():
    if hasattr(_thread_locals, "university"):
        del _thread_locals.university