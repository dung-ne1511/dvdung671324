
const $ = id => document.getElementById(id);
const load = key => JSON.parse(localStorage.getItem(key) || "[]");
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const money = n => Number(n).toLocaleString("vi-VN") + " VNĐ";

let rooms = load("rooms").length ? load("rooms") : [
    { number: "101", type: "Thường", price: 300000, status: "Trống" },
    { number: "102", type: "VIP", price: 900000, status: "Đang sử dụng" },
    { number: "103", type: "VVIP", price: 1500000, status: "Trống" }
];
let customers = load("customers"), bookings = load("bookings");
let editRoom = -1, editCustomer = -1, editBooking = -1;

// HIEN THI PHONG
function renderRooms() {
    $("roomList").innerHTML = rooms.map((r, i) => `
        <tr>
            <td>${r.number}</td><td>${r.type}</td><td>${money(r.price)}</td>
            <td><select onchange="changeStatus(${i},this.value)">
                ${["Trống","Đang sử dụng"].map(s =>
                    `<option ${r.status===s?"selected":""}>${s}</option>`).join("")}
            </select></td>
            <td><button onclick="editRoomData(${i})">Sửa</button>
            <button onclick="deleteRoom(${i})">Xóa</button></td>
        </tr>`).join("");
    $("total").textContent = rooms.length;
    $("empty").textContent = rooms.filter(r => r.status === "Trống").length;
    $("used").textContent = rooms.filter(r => r.status === "Đang sử dụng").length;
    save("rooms", rooms);
    renderOptions();
}

$("roomForm").onsubmit = e => {
    e.preventDefault();
    const room = {
        number: $("number").value.trim(),
        type: $("type").value,
        price: Number($("price").value),
        status: "Trống"
    };
    if (rooms.some((r, i) => r.number === room.number && i !== editRoom))
        return alert("Số phòng đã tồn tại!");
    if (editRoom < 0) rooms.push(room);
    else { room.status = rooms[editRoom].status; rooms[editRoom] = room; }
    editRoom = -1; e.target.reset(); e.target.querySelector("button").textContent = "Thêm phòng";
    renderRooms();
};

function editRoomData(i) {
    const r = rooms[i];
    $("number").value = r.number; $("type").value = r.type;
    $("price").value = r.price; editRoom = i;
    $("roomForm").querySelector("button").textContent = "Lưu thay đổi";
}
function deleteRoom(i) {
    if (bookings.some(b => b.roomNumber === rooms[i].number && b.status !== "Đã hủy"))
        return alert("Phòng đang có đặt phòng, không thể xóa!");
    if (confirm("Xóa phòng này?")) { rooms.splice(i, 1); renderRooms(); }
}
function changeStatus(i, status) {
    rooms[i].status = status; renderRooms();
}

// HIEN THI KHACH HANG
function renderCustomers() {
    $("customerList").innerHTML = customers.map((c, i) => `
        <tr><td>${i+1}</td><td>${c.name}</td><td>${c.phone}</td><td>${c.email}</td>
        <td><button onclick="editCustomerData(${i})">Sửa</button>
        <button onclick="deleteCustomer(${i})">Xóa</button></td></tr>`).join("");
    save("customers", customers); renderOptions();
}

$("customerForm").onsubmit = e => {
    e.preventDefault();
    const c = {
        name: $("customerName").value.trim(),
        phone: $("customerPhone").value.trim(),
        email: $("customerEmail").value.trim()
    };
    if (customers.some((x, i) => x.phone === c.phone && i !== editCustomer))
        return alert("Số điện thoại đã tồn tại!");
    if (editCustomer < 0) customers.push(c);
    else customers[editCustomer] = c;
    editCustomer = -1; e.target.reset();
    $("customerSubmit").textContent = "Thêm khách hàng";
    renderCustomers();
};

function editCustomerData(i) {
    const c = customers[i];
    $("customerName").value = c.name; $("customerPhone").value = c.phone;
    $("customerEmail").value = c.email; editCustomer = i;
    $("customerSubmit").textContent = "Lưu thay đổi";
}
function deleteCustomer(i) {
    if (bookings.some(b => b.customerName === customers[i].name && b.status !== "Đã hủy"))
        return alert("Khách hàng đang có đặt phòng!");
    if (confirm("Xóa khách hàng này?")) { customers.splice(i, 1); renderCustomers(); }
}

// CAP NHAT LUA CHON DAT PHONG
function renderOptions() {
    if (!$("bookingCustomer")) return;
    $("bookingCustomer").innerHTML = '<option value="">-- Chọn khách hàng --</option>' +
        customers.map((c, i) => `<option value="${i}">${c.name} - ${c.phone}</option>`).join("");
    $("bookingRoom").innerHTML = '<option value="">-- Chọn phòng --</option>' +
        rooms.map((r, i) => `<option value="${i}" ${r.status==="Đang sử dụng"?"disabled":""}>${r.number} - ${r.type} - ${money(r.price)}</option>`).join("");
}

// HIEN THI DAT PHONG
function renderBookings() {
    $("bookingList").innerHTML = bookings.map((b, i) => `
        <tr><td>${i+1}</td><td>${b.customerName}</td><td>${b.roomNumber}</td>
        <td>${b.checkIn}</td><td>${b.checkOut}</td><td>${b.days} ngày</td>
        <td>${money(b.total)}</td><td>${b.status}</td>
        <td><button onclick="cancelBooking(${i})" ${b.status==="Đã hủy"?"disabled":""}>Hủy</button></td></tr>`).join("");
    save("bookings", bookings);
}

$("bookingForm").onsubmit = e => {
    e.preventDefault();
    const ci = $("bookingCustomer").value, ri = $("bookingRoom").value;
    if (ci === "" || ri === "") return alert("Hãy chọn khách hàng và phòng!");
    const checkIn = $("checkIn").value, checkOut = $("checkOut").value;
    if (!checkIn || !checkOut || checkIn >= checkOut)
        return alert("Ngày trả phòng phải sau ngày nhận phòng!");
    const room = rooms[ri], customer = customers[ci];
    if (!room || !customer) return alert("Thông tin không hợp lệ!");
    if (bookings.some(b => b.roomNumber === room.number && b.status !== "Đã hủy" &&
        checkIn < b.checkOut && checkOut > b.checkIn))
        return alert("Phòng đã được đặt trong khoảng thời gian này!");
    const days = (new Date(checkOut+"T00:00:00") - new Date(checkIn+"T00:00:00")) / 86400000;
    bookings.push({ customerName: customer.name, roomNumber: room.number,
        checkIn, checkOut, days, total: days * Number(room.price), status: "Đã đặt" });
    e.target.reset(); renderBookings(); alert("Đặt phòng thành công!");
};

function cancelBooking(i) {
    if (confirm("Bạn muốn hủy đặt phòng này?")) {
        bookings[i].status = "Đã hủy"; renderBookings();
    }
}

// KHOI TAO
renderRooms();
renderCustomers();
renderBookings();
