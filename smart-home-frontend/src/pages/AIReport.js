import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  Leaf,
  Award,
  Wrench,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  staggerContainer,
  fadeUp
} from '../utils/motionVariants';
import useReducedMotion from '../utils/useReducedMotion';
import { monthlyReportService } from '../services/api';

const AIReport = () => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const [gaugeValue, setGaugeValue] = useState(0);

  const [countUp, setCountUp] = useState({
    energy: 0,
    bill: 0,
    co2: 0
  });

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data =
          await monthlyReportService.getMonthlyReport();

        console.log('Monthly Report:', data);

        setReport(data);
      } catch (error) {
        console.error(
          'Failed to load monthly report:',
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  useEffect(() => {
    if (!report) return;

    const values = {
      energy: report.energyUsed || 0,
      bill: report.electricityBill || 0,
      co2: report.co2Saved || 0
    };

    if (reducedMotion) {
      setGaugeValue(report.efficiencyRating || 0);
      setCountUp(values);
      return;
    }

    const gaugeTimer = setTimeout(() => {
      setGaugeValue(report.efficiencyRating || 0);
    }, 200);

    const countTimer = setTimeout(() => {
      setCountUp(values);
    }, 250);

    return () => {
      clearTimeout(gaugeTimer);
      clearTimeout(countTimer);
    };
  }, [report, reducedMotion]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[#0a5c53]">
        <div className="text-center">
          <Zap className="text-3xl mx-auto mb-3 animate-pulse" />

          <p className="font-bold">
            {t('aiReport.generating', 'Generating monthly report...')}
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
          <p className="font-bold text-red-500">
            {t('aiReport.loadError', 'Unable to load monthly report.')}
          </p>

          <p className="text-sm text-[#5c6e6a] mt-2">
            {t('aiReport.checkBackend', 'Check the backend API and try again.')}
          </p>
        </div>
      </div>
    );
  }

  const aiInsights = Array.isArray(report.aiInsights)
    ? report.aiInsights
    : [];

  const gaugeCircumference = 301;

  const gaugeOffset =
    gaugeCircumference -
    (Math.min(Math.max(gaugeValue, 0), 100) / 100) *
      gaugeCircumference;

  return (
    <div className="space-y-8 animate-fade-in text-[#1e293b]">


            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-[#5c6e6a] text-xs font-bold uppercase tracking-[0.2em] mb-1">
            {t('aiReport.systemIntelligence')}
          </p>

          <h1 className="sr-only">Monthly AI Report</h1>
          <h2 className="text-3xl font-bold text-[#0a5c53] tracking-tight">
            Intelligence Report: {report.month}
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#0a5c53]/10 shadow-sm">
          <CheckCircle className="text-[#0a5c53]" />

          <span className="text-xs font-bold text-[#5c6e6a] uppercase tracking-widest">
            {t('aiReport.optimizedStatus')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">

      

              <section className="col-span-12 lg:col-span-8 bg-white border border-[#0a5c53]/10 rounded-2xl p-6 md:p-8 flex flex-col justify-between hover:border-[#0a5c53]/30 hover:shadow-[0_8px_24px_rgba(10,92,83,0.04)] transition-all duration-300 relative overflow-hidden group shadow-sm">

          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#0a5c53]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#0a5c53]">
                  {t('aiReport.efficiencyGlance')}
                </h3>

                <p className="text-xs text-[#5c6e6a] mt-1">
                  {t('aiReport.efficiencySub')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c6e6a]">
                  {t('aiReport.energyUsed')}
                </p>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-[#0a5c53]">
                    {Number(countUp.energy).toFixed(2)}
                  </span>

                  <span className="text-[#5c6e6a] text-sm font-medium">
                    kWh
                  </span>
                </div>

                <p className="text-xs text-[#0a5c53] flex items-center gap-1 font-semibold">
                  <Leaf className="text-xs" />
                  {t('aiReport.calculatedFromUsage', "Calculated from this month's usage logs")}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c6e6a]">
                  {t('aiReport.electricityBill')}
                </p>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-[#1e293b]">
                    ₹{Number(countUp.bill).toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-[#5c6e6a] font-medium">
                  {t('aiReport.estimatedFromUsage', 'Estimated from recorded usage')}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c6e6a]">
                  {t('aiReport.co2Saved')}
                </p>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-[#2ec4b6]">
                    {Number(countUp.co2).toFixed(2)}
                  </span>

                  <span className="text-[#5c6e6a] text-sm font-medium">
                    kg
                  </span>
                </div>

                <p className="text-xs text-[#2ec4b6] font-semibold">
                  {t('aiReport.basedOnBackend', 'Based on backend report data')}
                </p>
              </div>

            </div>
          </div>
        </section>

                <motion.section
          className="col-span-12 lg:col-span-4 bg-white border border-[#0a5c53]/25 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center hover:border-[#0a5c53]/45 transition-all shadow-sm"
          variants={reducedMotion ? {} : fadeUp}
          initial={reducedMotion ? false : 'hidden'}
          animate={reducedMotion ? undefined : 'visible'}
        >
          <div className="relative mb-4 w-28 h-28 flex items-center justify-center">

            <svg className="w-full h-full transform -rotate-90">
              <circle
                className="text-[#f3f7f6]"
                cx="56"
                cy="56"
                r="48"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
              />

              <circle
                className="text-[#0a5c53] transition-all duration-1000 ease-out"
                cx="56"
                cy="56"
                r="48"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={gaugeOffset}
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute text-center">
              <span className="block text-3xl font-extrabold text-[#0a5c53]">
                {gaugeValue}
              </span>

              <span className="text-[9px] uppercase font-bold tracking-widest text-[#5c6e6a]">
                / 100
              </span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-[#0a5c53] mb-2">
            {t('aiReport.efficiencyRating')}
          </h3>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a5c53]/10 text-[#0a5c53] text-[10px] font-bold border border-[#0a5c53]/20 tracking-wider">
            <Award className="text-xs" />
            DATA DRIVEN
          </span>

          <p className="mt-3 text-[#5c6e6a] text-xs leading-relaxed font-medium">
            Rating calculated from your current monthly usage data.
          </p>
        </motion.section>

                <section className="col-span-12 lg:col-span-4 bg-white border border-[#0a5c53]/10 rounded-2xl overflow-hidden flex flex-col hover:border-[#0a5c53]/30 transition-all shadow-sm">

          <div className="h-32 bg-gradient-to-br from-[#0a5c53]/5 to-transparent relative p-5 flex justify-between items-start">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-xl bg-white border border-[#0a5c53]/10 flex items-center justify-center text-[#0a5c53]">
                <Wrench className="text-lg" />
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#5c6e6a]">
                  {t('aiReport.mostUsedNode')}
                </p>

                <h4 className="text-base font-bold text-[#0a5c53]">
                  {report.mostUsedDevice || 'No usage data'}
                </h4>
              </div>

            </div>
          </div>

          <div className="p-5 flex-grow space-y-4">

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5c6e6a]">
                Recorded Consumption
              </span>

              <span className="text-[#0a5c53] font-bold">
                {Number(
                  report.mostUsedDeviceConsumption || 0
                ).toFixed(2)} W
              </span>
            </div>

            <div className="w-full bg-[#f3f7f6] h-1.5 rounded-full overflow-hidden">

              <motion.div
                className="bg-[#0a5c53] h-full w-full origin-left"
                initial={
                  reducedMotion
                    ? false
                    : { scaleX: 0 }
                }
                animate={{ scaleX: 1 }}
                transition={{
                  duration: 0.4,
                  ease: 'easeOut'
                }}
              />

            </div>

            <div className="flex justify-between items-center text-xs">

              <span className="text-[#5c6e6a]">
                Data Source
              </span>

              <span className="text-[#2ec4b6] font-bold">
                Energy Usage Logs
              </span>

            </div>
          </div>
        </section>

                <motion.section
          className="col-span-12 lg:col-span-8 bg-white border border-[#0a5c53]/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm"
          variants={
            reducedMotion
              ? {}
              : staggerContainer
          }
          initial={
            reducedMotion
              ? false
              : 'hidden'
          }
          whileInView={
            reducedMotion
              ? undefined
              : 'visible'
          }
          viewport={{
            once: true,
            amount: 0.3
          }}
        >

          <div className="flex items-center gap-3">

            <div className="w-8 h-8 rounded-lg bg-[#0a5c53]/5 border border-[#0a5c53]/10 flex items-center justify-center text-[#0a5c53]">
              <Zap className="text-base" />
            </div>

            <h3 className="text-lg font-bold text-[#0a5c53]">
              {t('aiReport.aiSmartInsights')}
            </h3>

          </div>

          {aiInsights.length === 0 ? (

            <div className="p-6 rounded-xl bg-[#f3f7f6]/60 border border-[#0a5c53]/5">

              <p className="text-[#5c6e6a] text-xs leading-relaxed font-medium">
                No AI insights generated yet. Connect the
                backend monthly report service to Ollama
                Qwen3:4b to generate insights from real
                report data.
              </p>

            </div>

          ) : (

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={
                reducedMotion
                  ? {}
                  : staggerContainer
              }
            >

              {aiInsights.map((insight, index) => (

                <motion.div
                  key={`${index}-${insight}`}
                  variants={
                    reducedMotion
                      ? {}
                      : fadeUp
                  }
                  className="p-5 rounded-xl bg-[#f3f7f6]/60 border border-[#0a5c53]/5 hover:border-[#0a5c53]/25 transition-all"
                >

                  <div className="flex items-center gap-2 text-[#0a5c53] mb-2">

                    <Zap className="text-xs" />

                    <h5 className="text-xs font-bold uppercase tracking-wider">
                      AI Insight {index + 1}
                    </h5>

                  </div>

                  <p className="text-[#5c6e6a] text-xs leading-relaxed font-medium">
                    {insight}
                  </p>

                </motion.div>

              ))}

            </motion.div>

          )}

                    <motion.div
            variants={
              reducedMotion
                ? {}
                : fadeUp
            }
            className="p-5 rounded-xl bg-[#2ec4b6]/10 border border-[#2ec4b6]/25 flex gap-4 items-center"
          >

            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0a5c53] flex-shrink-0 border border-[#0a5c53]/10">

              <Award className="text-2xl text-[#2ec4b6]" />

            </div>

            <div>

              <h5 className="text-[#0a5c53] font-bold text-xs uppercase tracking-wider mb-1">
                Real Monthly Analysis
              </h5>

              <p className="text-[#5c6e6a] text-xs leading-relaxed font-medium">
                This report uses values returned by the
                ASP.NET monthly report API instead of
                static demo metrics.
              </p>

            </div>

          </motion.div>

        </motion.section>

      </div>

    </div>
  );
};

export default AIReport;

