import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";

import ProfessionalCustomers from "../ProfessionalCustomers";
jest.mock("../../../utils/auth", () => ({
  getValidToken: () => ({ token: "test-token" }),
}));

describe("ProfessionalCustomers guest behaviour", () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
  });

  test("enables note management for guest summaries", async () => {
    const guestKey = "guest:email:guest@example.com";

    axios.get
      .mockResolvedValueOnce({
        data: {
          customers: [
            {
              customerKey: guestKey,
              customerId: null,
              guestInfo: { name: "Walk-in Guest", email: "guest@example.com" },
              totalBookings: 1,
              lastBookingDate: "2023-01-01T00:00:00.000Z",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          customer: null,
          guestInfo: { name: "Walk-in Guest", email: "guest@example.com" },
          notes: [],
          bookings: [],
        },
      });

    render(
      <MemoryRouter initialEntries={[`/customers/${guestKey}`]}>
        <Routes>
          <Route path="/customers/:customerId" element={<ProfessionalCustomers />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/Add a quick reminder/i)).toBeInTheDocument()
    );

    expect(
      screen.queryByText(/Select a profile to add private notes/i)
    ).not.toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/How was the last visit/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea).not.toHaveAttribute("disabled");
  });
});
