import React, { useState } from "react";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import HttpsIcon from "@mui/icons-material/Https";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Autocomplete from "@mui/material/Autocomplete";
import Typography from "@mui/material/Typography";
import AccessDialogTitle from "./AccessDialogTitle";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import Avatar from "@mui/material/Avatar";
import { stringAvatar } from "../helper_functions/muiAvatar";
import Snackbar from "@mui/material/Snackbar";
import {
  getUsersWithoutAccess,
  getUsersWithAccess,
  addUserToDocument,
} from "../services/user";

const AccessDialog = ({ documentId }) => {
  const [open, setOpen] = useState(false);
  const [addUser, setAddUser] = useState(null);
  const {
    mutate: addUserAccessMutation,
    error: userAccessError,
    isError: isUserAccessError,
  } = useMutation({
    mutationFn: ({ name, documentId }) => {
      return addUserToDocument({ name, documentId });
    },
    onSuccess: (res) => {
      console.log(res);
    },
  });
  const { data: usersWithoutAccess, isLoading: isUserFetching } = useQuery({
    queryKey: ["users", "withoutAccess", "documentId", open], // it will refetch whenever user opens the dialog
    queryFn: () => getUsersWithoutAccess(documentId),
    refetchOnWindowFocus: false,
  });

  const { data: userAccess, isLoading: isAccessFetching } = useQuery({
    queryKey: ["users", "withAccess", "documentId", open],
    queryFn: () => getUsersWithAccess(documentId),
    refetchOnWindowFocus: false, // it is not necessary to keep refetching
  });
  // if (!isUserFetching) console.log(usersWithoutAccess.data);
  // if (!isAccessFetching) console.log(userAccess.data);

  console.log(addUser);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    addUserAccessMutation({ name: addUser, documentId });
    setOpen(false);
  };
  return (
    <Box>
      <Button
        onClick={handleClickOpen}
        variant="contained"
        sx={{
          alignItems: "center",
          backgroundColor: "#a5d8ff",
          color: "#001d35",
          borderRadius: "30px",
        }}
        startIcon={<HttpsIcon fontSize="small" />}
      >
        Share
      </Button>
      <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
        {/* add document title here */}
        <AccessDialogTitle onClose={handleClose}>Share</AccessDialogTitle>
        <DialogContent
          xs={{ display: "flex", flexDirection: "column" }}
          gap={2}
          dividers={true}
        >
          {isUserFetching ? (
            <Typography>Loading...</Typography>
          ) : (
            <Autocomplete
              onChange={(e) => {
                setAddUser(e.target.innerText);
              }}
              getOptionLabel={(option) => option.name}
              id="combo-box-demo"
              options={usersWithoutAccess.data}
              fullWidth
              renderInput={(params) => (
                <TextField {...params} label="Add People" />
              )}
            />
          )}
          <Typography variant="h6" component="h6">
            People with access
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {!isAccessFetching &&
              userAccess.data &&
              userAccess.data.map((user) => {
                return (
                  <Box key={user.id} display="flex" gap={2}>
                    <Avatar {...stringAvatar(user.name)} />
                    <Box>
                      <Typography variant="h6" component="h6">
                        {user.name}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
          </Box>
          <Typography variant="h6" component="h5">
            General access
          </Typography>
          <Box display="flex" gap={2}>
            {/* general access */}
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Button
              onClick={() =>
                navigator.clipboard.writeText(window.location.href)
              }
              sx={{ borderRadius: "20px" }}
              variant="outlined"
              startIcon={<InsertLinkIcon />}
            >
              Copy Link
            </Button>
            <DialogActions>
              <Button variant="contained" autoFocus onClick={handleClose}>
                Save changes
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AccessDialog;
