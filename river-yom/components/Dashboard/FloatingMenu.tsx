import React, { useState } from "react";
import { Fab, Menu, MenuItem } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

type MenuItemType = {
  label: string;
  targetId: string;
};

type FloatingMenuProps = {
  menus: MenuItemType[];
};

const FloatingMenu: React.FC<FloatingMenuProps> = ({ menus }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleScrollTo = (id: string) => {
    handleClose();
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);
  };

  return (
    <>
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}
        onClick={handleClick}
      >
        {anchorEl ? <ExpandLess /> : <ExpandMore />}
      </Fab>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {menus.map((menu, index) => (
          <MenuItem
            key={index}
            sx={{ fontFamily: "Prompt" }}
            onClick={() => handleScrollTo(menu.targetId)}
          >
            {menu.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FloatingMenu;