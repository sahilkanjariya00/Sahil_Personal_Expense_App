import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  type ChartData,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import dayjs, { Dayjs } from "dayjs";
import {
  AppBox,
  AppButton,
  AppContainer,
  AppDatePicker,
  AppGrid,
  AppPaper,
  AppSelect,
  AppStack,
  AppTypography,
} from "../../stories";
import { fetchCategoryChartData, fetchMonthlyChartData, type CategoryChartPropType, type CategoryMonthlyPropType } from "../../APIs/GetChartData";
import { createQueryUrl, formatINR } from "../../Util/helper";
import { CATEGORY, MONTHLY, SUMMARY } from "../../Util/Endpoint";
import { BUTTON, DATE_FORMATE, PALETTE, ROUTES } from "../../Util/constants";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Summary = () => {
  // Filters for category-by-range
  const navigate = useNavigate();
  const today = new Date();
  const past30 = new Date();
  past30.setDate(today.getDate() - 30);
  const thisYear = new Date().getFullYear();

  const [from, setFrom] = useState<string>(past30.toISOString().slice(0, 10));
  const [to, setTo] = useState<string>(today.toISOString().slice(0, 10));

  const [year, setYear] = useState<number>(thisYear);
  const [pieData, setPieData] = useState<ChartData<"pie", number[] | undefined, string>>({
    labels: [],
    datasets: [
      {
        label: "Expense by Category (INR)",
        data: [],
      },
    ],
  });
  const [catChartLoading, setCatChartLoading] = useState(true);
  const [barData, setBarData] = useState<ChartData<"bar", number[] | undefined, string>>({
    labels: [],
    datasets: [
      {
        label: `Monthly Expense in ${year} (INR)`,
        data: [],
      },
    ],
  });
  const [monChartLoading, setMonChartLoading] = useState(true);

  const userId = 1;

  useEffect(() => {
    getCategoryChart();
  }, [from, to]);

  useEffect(() => {
    getMontlyChart();
  }, [year])

  // For category chart, fetch within date range (type=expense handled in helpers)
  const getCategoryChart = () => {
    setCatChartLoading(true);
    const params: CategoryChartPropType = {
      user_id: userId,
    }

    if (from) {
      params.from = from;
    }

    if (to) {
      params.to = to;
    }

    const url = createQueryUrl(`${SUMMARY}${CATEGORY}`, params);

    fetchCategoryChartData(url).then((val) => {
      setCatChartLoading(false);
      const pieColors = val.data?.labels.map((_, i) => PALETTE[i % PALETTE.length]);
      setPieData({
        labels: val.data?.labels,
        datasets: [
          {
            label: "Expense by Category (INR)",
            data: val.data?.values,
            backgroundColor: pieColors,
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      });
    }).catch(() => {
      setCatChartLoading(false);
    });
  };

  const getMontlyChart = () => {
    setMonChartLoading(true);
    const params: CategoryMonthlyPropType = {
      user_id: userId,
      year: year
    }

    const url = createQueryUrl(`${SUMMARY}${MONTHLY}`, params);

    fetchMonthlyChartData(url).then((val) => {
      setMonChartLoading(false);
      const pieColors = val.data?.labels.map((_, i) => PALETTE[i % PALETTE.length]);
      setBarData({
        labels: val.data?.labels,
        datasets: [
          {
            label: `Monthly Expense in ${year} (INR)`,
            data: val.data?.values,
            backgroundColor: pieColors,
            borderWidth: 0,
            // hoverOffset: 6,
          },
        ],
      });
    }).catch(() => {
      setMonChartLoading(false);
    });

  }

  // Years dropdown options (current year ±4)
  const yearOptions = Array.from({ length: 9 }, (_, i) => thisYear - 4 + i).map(
    (y) => ({ label: String(y), value: y })
  );

  const handleBackClick = () => {
    navigate(ROUTES.default);
  }

  return (
    <AppContainer maxWidth="lg" sx={{ py: 4 }}>
      <AppStack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <AppTypography variant="h5">Summary</AppTypography>
        <AppButton variant="outlined" onClick={handleBackClick}>{BUTTON.BACK_TO_TRANSACTIONS}</AppButton>
      </AppStack>
      <AppGrid container spacing={3}>
        {/* Category by Date Range */}
        <AppGrid item xs={12} md={6}>
          <AppPaper variant="outlined" sx={{ p: 2 }}>
            <AppTypography variant="h6" sx={{ mb: 2 }}>
              Expenses by Category
            </AppTypography>
            <AppStack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <AppBox sx={{ minWidth: 220 }}>
                <AppDatePicker
                  label="From"
                  value={from ? dayjs(from) : null}
                  onChange={(v) =>
                    setFrom((v as Dayjs).format(DATE_FORMATE))
                  }
                />
              </AppBox>
              <AppBox sx={{ minWidth: 220 }}>
                <AppDatePicker
                  label="To"
                  value={to ? dayjs(to) : null}
                  onChange={(v) =>
                    setTo((v as Dayjs).format(DATE_FORMATE))
                  }
                />
              </AppBox>
              <AppButton
                variant="outlined"
                onClick={() => {
                  setFrom(past30.toISOString().slice(0, 10));
                  setTo(today.toISOString().slice(0, 10));
                }}
              >
                {BUTTON.RESET}
              </AppButton>
            </AppStack>

            {catChartLoading ? (
              <AppBox sx={{ py: 6, textAlign: "center" }}>Loading…</AppBox>
            ) : pieData?.labels?.length === 0 ? (
              <AppBox sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                No expense data for the selected range.
              </AppBox>
            ) : (
              <Pie data={pieData} />
            )}
          </AppPaper>
        </AppGrid>

        {/* Month-wise for selected year */}
        <AppGrid item xs={12} md={6}>
          <AppPaper variant="outlined" sx={{ p: 2 }}>
            <AppTypography variant="h6" sx={{ mb: 2 }}>
              Monthly Expenses
            </AppTypography>
            <AppStack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <AppBox sx={{ minWidth: 220 }}>
                <AppSelect
                  label="Year"
                  options={yearOptions}
                  value={year}
                  onChange={(e: any) => setYear(Number(e.target.value))}
                />
              </AppBox>
            </AppStack>

            {monChartLoading ? (
              <AppBox sx={{ py: 6, textAlign: "center" }}>Loading…</AppBox>
            ) : (
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: true },
                    title: { display: false, text: "" },
                  },
                  scales: {
                    y: {
                      ticks: { callback: (v: any) => formatINR(Number(v)) },
                    },
                  },
                }}
              />
            )}
          </AppPaper>
        </AppGrid>
      </AppGrid>
    </AppContainer>
  );
}

export default Summary;
