import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { AppIconButton, AppPaper } from "../../stories";
import type { Transaction } from "../../APIs/GetTransactions";
import { TABLE_HEADING, ROWSPERPAGEOPTOINS } from "../../Util/constants";
import { formatINR } from "../../Util/helper";

type TransactionTableType = {
    rows: Transaction[];
    total: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    handleEditClick: (t: Transaction) => void;
    handleDeleteClick: (t: Transaction) => void;
};


const TransactionsTable = ({
    rows,
    total,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    handleEditClick,
    handleDeleteClick
}: TransactionTableType) => {

    const muiPage = Math.max(0, page - 1);

    return (
        <AppPaper variant="outlined">
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{TABLE_HEADING.DATE}</TableCell>
                        <TableCell>{TABLE_HEADING.TYPE}</TableCell>
                        <TableCell>{TABLE_HEADING.CATEGORY}</TableCell>
                        <TableCell>{TABLE_HEADING.DESCRIPTION}</TableCell>
                        <TableCell align="right">{TABLE_HEADING.AMOUNT}</TableCell>
                        <TableCell align="right">{TABLE_HEADING.ACTIONS}</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                No transactions found for this range.
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((t) => (
                            <TableRow key={t.id} hover>
                                <TableCell>{t.date}</TableCell>
                                <TableCell sx={{ textTransform: "capitalize" }}>{t.type}</TableCell>
                                <TableCell>{t.category ?? "—"}</TableCell>
                                <TableCell>{t.description || "—"}</TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ fontWeight: 600, color: t.type === "expense" ? "error.main" : "success.main" }}
                                >
                                    {t.type === "expense"
                                        ? `- ${formatINR(Number(t.amount))}`
                                        : `+ ${formatINR(Number(t.amount))}`}
                                </TableCell>
                                <TableCell align="right">
                                    <AppIconButton size="small" onClick={() => handleEditClick(t)} aria-label="edit">
                                        <EditIcon fontSize="small" />
                                    </AppIconButton>
                                    <AppIconButton size="small" onClick={() => handleDeleteClick(t)} aria-label="delete" sx={{ ml: 1 }}>
                                        <DeleteIcon fontSize="small" />
                                    </AppIconButton>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <TablePagination
                component="div"
                count={total}
                page={muiPage}
                rowsPerPage={rowsPerPage}
                onPageChange={(_e, newMuiPage) => onPageChange(newMuiPage + 1)}
                onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
                rowsPerPageOptions={ROWSPERPAGEOPTOINS}
            />
        </AppPaper>
    );
};

export default TransactionsTable;