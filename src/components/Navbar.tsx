"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { CiLogout } from "react-icons/ci";
import EmployeesModal from "@/components/EmployeesModal";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  // Hide Navbar on the root ("/") page
  if (pathname === "/") {
    return null;
  }

  return (
    <>
      <div className="bg-econs-blue shadow-md border-b px-6 py-3 flex justify-between items-center">
        <a href="/dashboard">
          <Image src="/logo2.png" alt="Econs Logo" width={140} height={30} />
        </a>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEmployeesModalOpen(true)}
            className="bg-black text-white px-4 py-1 rounded cursor-pointer hover:bg-black/80"
          >
            Employees
          </button>
          <button
            onClick={() => router.push("/attendance")}
            className="bg-black text-white px-4 py-1 rounded cursor-pointer hover:bg-black/80"
          >
            Mark Attendance
          </button>
          <button
            onClick={handleLogout}
            className="bg-black text-white px-4 py-1 rounded cursor-pointer hover:bg-black/80"
          >
            <CiLogout className="inline mr-2" />
            Logout
          </button>
        </div>
      </div>
      <EmployeesModal
        isOpen={isEmployeesModalOpen}
        onClose={() => setIsEmployeesModalOpen(false)}
        router={router}
      />
    </>
  );
}
