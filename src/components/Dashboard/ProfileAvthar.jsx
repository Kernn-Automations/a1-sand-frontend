import React, { useState } from "react";
import styles from "./Dashboard.module.css";
import { Avatar } from "@/components/ui/avatar";
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import LogoutModal from "./LogoutModal";
import PasskeyModal from "./PasskeyModal";
import { Link, useNavigate } from "react-router-dom";

function ProfileAvthar({ user, setTab }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const navigate = useNavigate();

  const actualUser = user?.user || user || {};
  const userName = actualUser.name || actualUser.user?.name || user?.name || "";

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* <PopoverRoot>
        <PopoverTrigger asChild>
          <Avatar className={styles.avathar} name={user && user.employee_name} colorPalette="red" />
        </PopoverTrigger>
        <PopoverContent className={styles.popcontent}>
          
        </PopoverContent>
      </PopoverRoot> */}

      <PopoverRoot>
        <PopoverTrigger asChild>
          <button style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
            <Avatar
              className={styles.avatar}
              name={userName}
              colorPalette="var(--primary-color)"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className={styles.profilecontent}>
          <PopoverBody className={styles.profilebody}>
            <Link to="/profile">
              <div onClick={() => setTab("profile")}>
                <p>
                  <span>
                    <svg
                      width="37"
                      height="37"
                      viewBox="0 0 37 37"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.88155 30.4518L12.7741 24.5592M24.5592 24.5592L30.4518 30.4517M35.3333 18.6667C35.3333 27.8714 27.8714 35.3333 18.6667 35.3333C9.46192 35.3333 2 27.8714 2 18.6667C2 9.46192 9.46192 2 18.6667 2C27.8714 2 35.3333 9.46192 35.3333 18.6667ZM27 18.6667C27 23.269 23.269 27 18.6667 27C14.0643 27 10.3333 23.269 10.3333 18.6667C10.3333 14.0643 14.0643 10.3333 18.6667 10.3333C23.269 10.3333 27 14.0643 27 18.6667Z"
                        stroke="black"
                        strokeWidth="3.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Profile
                </p>
              </div>
            </Link>

            <div onClick={() => setIsPasskeyModalOpen(true)} style={{ cursor: "pointer" }}>
              <p>
                <span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ margin: "0 6px" }}
                  >
                    <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
                    <circle cx="16.5" cy="7.5" r=".5" />
                  </svg>
                </span>
                Set Passkey
              </p>
            </div>

            <div onClick={() => setIsModalOpen(true)}>
              <p>
                <span>
                  <svg
                    width="37"
                    height="37"
                    viewBox="0 0 37 37"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.20751 10.25C7.06043 5.31813 12.3927 2 18.5001 2C27.6127 2 35 9.38728 35 18.4999C35 27.6126 27.6127 34.9999 18.5001 34.9999C12.3927 34.9999 7.06043 31.6818 4.20751 26.7499M18.4999 25.0999L25.0999 18.4999M25.0999 18.4999L18.4999 11.9M25.0999 18.4999H2"
                      stroke="black"
                      strokeWidth="3.33333"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Logout
              </p>
            </div>
          </PopoverBody>
        </PopoverContent>
      </PopoverRoot>

      {isModalOpen && <LogoutModal isOpen={isModalOpen} onClose={closeModal} />}
      {isPasskeyModalOpen && (
        <PasskeyModal
          isOpen={isPasskeyModalOpen}
          onClose={() => setIsPasskeyModalOpen(false)}
        />
      )}
    </>
  );
}

export default ProfileAvthar;
