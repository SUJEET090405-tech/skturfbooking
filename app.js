const slotSelect = document.getElementById('slot');
const dateInput = document.getElementById('date');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const bookBtn = document.getElementById('bookBtn');
const notice = document.getElementById('notice');
const bookingsList = document.getElementById('bookingsList');

function setNotice(message, type = 'info') {
  notice.textContent = message;
  notice.style.borderColor = type === 'error' ? 'rgba(255, 80, 80, 0.75)' : 'rgba(56, 195, 240, 0.7)';
  notice.style.background =
    type === 'error' ? 'rgba(255, 80, 80, 0.18)' : 'rgba(56, 195, 240, 0.1)';
}

function formatBooking(booking) {
  const paid = booking.status === 'paid';
  const status = paid ? '✅ Paid' : '⏳ Pending';
  return `
    <div class="bookingItem">
      <div><strong>${booking.name}</strong> — <em>${booking.date}</em></div>
      <div>${booking.slot} • ${booking.price.toFixed(2)} ${booking.currency}</div>
      <div>${status}</div>
    </div>
  `;
}

async function fetchSlots() {
  try {
    const res = await fetch('/api/slots');
    const data = await res.json();

    slotSelect.innerHTML = '<option value="">Select a slot</option>';
    data.slots.forEach((slot) => {
      const option = document.createElement('option');
      option.value = slot;
      option.textContent = slot;
      slotSelect.append(option);
    });
  } catch (err) {
    setNotice('Unable to load slots. Reload to try again.', 'error');
    console.error(err);
  }
}

async function fetchBookings() {
  try {
    const res = await fetch('/api/bookings');
    const data = await res.json();
    bookingsList.innerHTML = data.bookings
      .slice(-6)
      .reverse()
      .map(formatBooking)
      .join('') || '<em>No bookings yet.</em>';
  } catch (err) {
    bookingsList.textContent = 'Unable to load bookings.';
    console.error(err);
  }
}

function validateForm() {
  if (!dateInput.value) {
    setNotice('Please pick a date.', 'error');
    return false;
  }

  if (!slotSelect.value) {
    setNotice('Please choose a time slot.', 'error');
    return false;
  }

  if (!nameInput.value.trim()) {
    setNotice('Please enter your name.', 'error');
    return false;
  }

  if (!emailInput.value.trim()) {
    setNotice('Please enter your email.', 'error');
    return false;
  }

  return true;
}

async function createBooking() {
  if (!validateForm()) return;

  bookBtn.disabled = true;
  setNotice('Creating booking…');

  try {
    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      date: dateInput.value,
      slot: slotSelect.value,
    };

    const res = await fetch('/api/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Booking failed.');
    }

    setNotice('Redirecting to payment…');
    window.location.href = data.url;
  } catch (err) {
    console.error(err);
    setNotice(err.message || 'Something went wrong.', 'error');
    bookBtn.disabled = false;
  }
}

bookBtn.addEventListener('click', createBooking);

window.addEventListener('load', () => {
  fetchSlots();
  fetchBookings();
});
