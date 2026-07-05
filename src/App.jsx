import { useEffect, useMemo, useState } from 'react';

const storageKeys = {
  daily: 'hannahHealth.dailyEntries',
  measurements: 'hannahHealth.measurements',
};

const todayIso = new Date().toISOString().slice(0, 10);

const defaultDailyEntry = {
  date: todayIso,
  weight: '',
  sleepQuality: '',
  sleepDisruption: '',
  usableEnergy: '',
  parentingLoad: '',
  symptoms: [],
  capacityImpact: '',
  hunger: '',
  cravings: '',
  foodConsistency: '',
  foodBarrier: '',
  plannedWorkout: '',
  resistanceTraining: '',
  cardioMinutes: '',
  steps: '',
  whoopStrain: '',
  movementFelt: '',
  periodToday: '',
  notes: '',
};

const defaultMeasurement = {
  date: todayIso,
  waist: '',
  hips: '',
  notes: '',
  context: [],
};

const choices = {
  sleepQuality: ['Good', 'Okay', 'Poor', 'Very poor'],
  sleepDisruption: [
    'No',
    'Yes - child woke',
    'Yes - illness',
    'Yes - stress / racing mind',
    'Yes - other',
    'Not sure',
  ],
  energy: [
    '1 - Wiped out: bare minimum day, everything feels hard',
    '2 - Low: can function, but energy is limited',
    '3 - Okay: manageable / normal-ish day',
    '4 - Good: decent energy, able to get things done',
    '5 - Strong: high energy / good capacity',
  ],
  parentingLoad: ['Normal', 'Higher than usual', 'Very high', 'Extreme'],
  symptoms: [
    'Heaviness',
    'Overwhelmed',
    'Feeling ill',
    'Brain fog',
    'Low motivation',
    'Irritable / short fuse',
    'Emotionally flat',
    'Restless / scattered',
    'Physically drained',
    'None',
  ],
  capacityImpact: [
    "Didn't really affect the day",
    'Affected the day a bit',
    'Affected the day a lot',
  ],
  hunger: ['Low', 'Normal', 'Higher than usual', 'Very high'],
  cravings: ['None / low', 'Moderate', 'Strong', 'Felt hard to manage'],
  foodConsistency: [
    'On track most of the day',
    'Mostly okay with a few wobbles',
    'A bit inconsistent',
    'Quite snacky / grazey',
    'Felt out of control',
    'Not sure',
  ],
  foodBarrier: [
    'Nothing obvious',
    'Tiredness',
    'Stress / emotions',
    'Hunger',
    'Cravings',
    'Poor planning',
    'Busy day',
    'Child / family demands',
    'Food around me',
    'Eating out / takeaway',
    'Social situation',
    'Period',
    'Feeling ill',
    'Overwhelm',
    'Other',
  ],
  plannedWorkout: ['No planned workout', 'Planned - completed', 'Planned - modified', 'Planned - missed'],
  yesNo: ['Yes', 'No'],
  movementFelt: ['Easy', 'Fine', 'Heavy', 'Harder than usual', "Didn't move much today"],
  periodToday: ['Yes', 'No', 'Not sure'],
  weeklyContext: [
    'Unusual week',
    'Illness',
    'Poor sleep',
    'Child unwell',
    'Period week',
    'Busy work week',
    'Eating out more than usual',
    'Training affected',
    'Energy better than usual',
    'Confidence better than usual',
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [dailyEntries, setDailyEntries] = useState(() => readJson(storageKeys.daily, {}));
  const [measurements, setMeasurements] = useState(() => readJson(storageKeys.measurements, {}));
  const [status, setStatus] = useState('Saved automatically.');

  const dailyEntry = useMemo(
    () => ({ ...defaultDailyEntry, date: selectedDate, ...dailyEntries[selectedDate] }),
    [dailyEntries, selectedDate],
  );

  const measurement = useMemo(
    () => ({ ...defaultMeasurement, date: selectedDate, ...measurements[selectedDate] }),
    [measurements, selectedDate],
  );

  const weekRange = useMemo(() => getSundayReviewRange(selectedDate), [selectedDate]);
  const weeklyData = useMemo(
    () => buildWeeklyData(dailyEntries, measurements, weekRange),
    [dailyEntries, measurements, weekRange],
  );

  useEffect(() => {
    writeJson(storageKeys.daily, dailyEntries);
  }, [dailyEntries]);

  useEffect(() => {
    writeJson(storageKeys.measurements, measurements);
  }, [measurements]);

  const updateDaily = (field, value) => {
    setDailyEntries((current) => ({
      ...current,
      [selectedDate]: {
        ...defaultDailyEntry,
        date: selectedDate,
        ...current[selectedDate],
        [field]: value,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const updateMeasurement = (field, value) => {
    setMeasurements((current) => ({
      ...current,
      [selectedDate]: {
        ...defaultMeasurement,
        date: selectedDate,
        ...current[selectedDate],
        [field]: value,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const copyDaily = async () => {
    await copyText(formatDailyExport(dailyEntry));
    setStatus('Daily coaching export copied.');
  };

  const copyWeekly = async () => {
    await copyText(formatWeeklyExport(weeklyData, weekRange));
    setStatus('Sunday review export copied.');
  };

  const copyPrompt = async () => {
    await copyText(chatGptPrompt);
    setStatus('ChatGPT project instructions copied.');
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Hannah</p>
          <h1>Health Tracker</h1>
        </div>
        <label className="date-picker">
          <span>Date</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
      </header>

      <nav className="tab-bar" aria-label="Tracker sections">
        <button className={activeTab === 'today' ? 'active' : ''} onClick={() => setActiveTab('today')}>Today</button>
        <button className={activeTab === 'insights' ? 'active' : ''} onClick={() => setActiveTab('insights')}>Insights</button>
        <button className={activeTab === 'export' ? 'active' : ''} onClick={() => setActiveTab('export')}>Export</button>
      </nav>

      {activeTab === 'today' && (
        <>
          <section className="quick-panel">
            <MetricCard label="Energy" value={dailyEntry.usableEnergy ? dailyEntry.usableEnergy.split(' - ')[0] : '-'} />
            <MetricCard label="Steps" value={dailyEntry.steps || '-'} />
            <MetricCard label="Weight" value={dailyEntry.weight ? `${dailyEntry.weight} lb` : '-'} />
          </section>

          <TrackerSection title="Morning">
            <Field label="Scale weight" suffix="lb">
              <input inputMode="decimal" value={dailyEntry.weight} onChange={(event) => updateDaily('weight', event.target.value)} />
            </Field>
            <ChoiceField label="Sleep quality" value={dailyEntry.sleepQuality} options={choices.sleepQuality} onChange={(value) => updateDaily('sleepQuality', value)} />
            <ChoiceField label="Sleep disrupted?" value={dailyEntry.sleepDisruption} options={choices.sleepDisruption} onChange={(value) => updateDaily('sleepDisruption', value)} />
          </TrackerSection>

          <TrackerSection title="Energy + Capacity">
            <ChoiceField label="Usable energy" value={dailyEntry.usableEnergy} options={choices.energy} onChange={(value) => updateDaily('usableEnergy', value)} />
            <ChoiceField label="Parenting / life load" value={dailyEntry.parentingLoad} options={choices.parentingLoad} onChange={(value) => updateDaily('parentingLoad', value)} />
            <MultiChoiceField label="Symptoms" value={dailyEntry.symptoms} options={choices.symptoms} onChange={(value) => updateDaily('symptoms', value)} />
            <ChoiceField label="Capacity impact" value={dailyEntry.capacityImpact} options={choices.capacityImpact} onChange={(value) => updateDaily('capacityImpact', value)} />
          </TrackerSection>

          <TrackerSection title="Food">
            <ChoiceField label="Hunger" value={dailyEntry.hunger} options={choices.hunger} onChange={(value) => updateDaily('hunger', value)} />
            <ChoiceField label="Cravings" value={dailyEntry.cravings} options={choices.cravings} onChange={(value) => updateDaily('cravings', value)} />
            <ChoiceField label="Food consistency" value={dailyEntry.foodConsistency} options={choices.foodConsistency} onChange={(value) => updateDaily('foodConsistency', value)} />
            <ChoiceField
              label="Main thing affecting food"
              helpText="Pick the biggest one, even if a few applied."
              value={dailyEntry.foodBarrier}
              options={choices.foodBarrier}
              onChange={(value) => updateDaily('foodBarrier', value)}
            />
          </TrackerSection>

          <TrackerSection title="Movement">
            <ChoiceField label="Planned workout" value={dailyEntry.plannedWorkout} options={choices.plannedWorkout} onChange={(value) => updateDaily('plannedWorkout', value)} />
            <ChoiceField label="Resistance training" value={dailyEntry.resistanceTraining} options={choices.yesNo} onChange={(value) => updateDaily('resistanceTraining', value)} />
            <Field label="Cardio minutes">
              <input inputMode="numeric" value={dailyEntry.cardioMinutes} onChange={(event) => updateDaily('cardioMinutes', event.target.value)} />
            </Field>
            <Field label="Step count">
              <input inputMode="numeric" value={dailyEntry.steps} onChange={(event) => updateDaily('steps', event.target.value)} />
            </Field>
            <Field label="Whoop strain">
              <input inputMode="decimal" value={dailyEntry.whoopStrain} onChange={(event) => updateDaily('whoopStrain', event.target.value)} />
            </Field>
            <ChoiceField label="Movement felt" value={dailyEntry.movementFelt} options={choices.movementFelt} onChange={(value) => updateDaily('movementFelt', value)} />
          </TrackerSection>

          <TrackerSection title="Cycle + Notes">
            <ChoiceField label="Period today?" value={dailyEntry.periodToday} options={choices.periodToday} onChange={(value) => updateDaily('periodToday', value)} />
            <label className="field full-width">
              <span>Anything useful to remember?</span>
              <textarea value={dailyEntry.notes} onChange={(event) => updateDaily('notes', event.target.value)} />
            </label>
          </TrackerSection>

          <TrackerSection title="Weekly Check In">
            <Field label="Waist" suffix="in">
              <input inputMode="decimal" value={measurement.waist} onChange={(event) => updateMeasurement('waist', event.target.value)} />
            </Field>
            <Field label="Hips" suffix="in">
              <input inputMode="decimal" value={measurement.hips} onChange={(event) => updateMeasurement('hips', event.target.value)} />
            </Field>
            <MultiChoiceField label="Week influenced by" value={measurement.context} options={choices.weeklyContext} onChange={(value) => updateMeasurement('context', value)} />
            <label className="field full-width">
              <span>Notes from reflecting over the week</span>
              <textarea value={measurement.notes} onChange={(event) => updateMeasurement('notes', event.target.value)} />
            </label>
          </TrackerSection>
        </>
      )}

      {activeTab === 'insights' && (
        <Insights weeklyData={weeklyData} weekRange={weekRange} />
      )}

      {activeTab === 'export' && (
        <section className="export-grid">
          <ExportCard title="Daily coaching" button="Copy today's data" onCopy={copyDaily}>
            For feedback during the week without changing the plan every day.
          </ExportCard>
          <ExportCard title="Sunday review" button="Copy weekly review" onCopy={copyWeekly}>
            For pattern analysis and one realistic focus for next week.
          </ExportCard>
          <ExportCard title="ChatGPT project" button="Copy instructions" onCopy={copyPrompt}>
            Use this as the shared project instruction text.
          </ExportCard>
          <p className="status-text">{status}</p>
        </section>
      )}
    </main>
  );
}

function TrackerSection({ title, children }) {
  return (
    <section className="tracker-section">
      <h2>{title}</h2>
      <div className="form-grid">{children}</div>
    </section>
  );
}

function Field({ label, suffix, children }) {
  return (
    <label className="field">
      <span>{label}{suffix ? ` (${suffix})` : ''}</span>
      {children}
    </label>
  );
}

function ChoiceField({ label, helpText, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      {helpText ? <small>{helpText}</small> : null}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function MultiChoiceField({ label, value = [], options, onChange }) {
  const toggle = (option) => {
    if (option === 'None') {
      onChange(value.includes(option) ? [] : ['None']);
      return;
    }
    const withoutNone = value.filter((item) => item !== 'None');
    onChange(
      withoutNone.includes(option)
        ? withoutNone.filter((item) => item !== option)
        : [...withoutNone, option],
    );
  };

  return (
    <div className="field full-width">
      <span>{label}</span>
      <div className="chip-grid">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={value.includes(option) ? 'selected' : ''}
            onClick={() => toggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ExportCard({ title, button, onCopy, children }) {
  return (
    <article className="export-card">
      <h2>{title}</h2>
      <p>{children}</p>
      <button className="primary-button" onClick={onCopy}>{button}</button>
    </article>
  );
}

function Insights({ weeklyData, weekRange }) {
  return (
    <section className="insights">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Week ending Sunday</p>
          <h2>{formatDate(weekRange.start)} to {formatDate(weekRange.end)}</h2>
        </div>
      </div>
      <div className="insight-grid">
        <InsightBlock title="Movement" items={[
          ['Resistance sessions', weeklyData.resistanceSessions],
          ['Planned workouts completed', weeklyData.completedPlannedWorkouts],
          ['Planned workouts missed', weeklyData.missedPlannedWorkouts],
          ['Cardio sessions', weeklyData.cardioSessions],
          ['Total cardio minutes', weeklyData.totalCardioMinutes],
          ['Average steps', weeklyData.averageSteps],
          ['Average Whoop strain', weeklyData.averageStrain],
        ]} />
        <InsightBlock title="Recovery" items={[
          ['Average energy', weeklyData.averageEnergy],
          ['Disrupted sleep nights', weeklyData.disruptedSleepNights],
          ['Poor / very poor sleep nights', weeklyData.poorSleepNights],
          ['Most common sleep disruption', weeklyData.commonSleepDisruption],
          ['Highest parenting load days', weeklyData.highLoadDays],
        ]} />
        <InsightBlock title="Food" items={[
          ['On-track days', weeklyData.foodCounts['On track most of the day'] || 0],
          ['Mostly okay days', weeklyData.foodCounts['Mostly okay with a few wobbles'] || 0],
          ['Snacky / grazey days', weeklyData.foodCounts['Quite snacky / grazey'] || 0],
          ['Felt out of control days', weeklyData.foodCounts['Felt out of control'] || 0],
          ['Most common food barrier', weeklyData.commonFoodBarrier],
        ]} />
        <InsightBlock title="Measurements" items={[
          ['Latest weight', weeklyData.latestWeight],
          ['7-day average weight', weeklyData.averageWeight],
          ['Latest waist', weeklyData.latestWaist],
          ['Latest hips', weeklyData.latestHips],
          ['Period days logged', weeklyData.periodDays],
        ]} />
      </div>
      <details className="prompt-panel">
        <summary>Pre-bleed window note</summary>
        <p>{weeklyData.preBleedNote}</p>
      </details>
    </section>
  );
}

function InsightBlock({ title, items }) {
  return (
    <article className="insight-block">
      <h3>{title}</h3>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || '-'}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function buildWeeklyData(dailyEntries, measurements, range) {
  const dates = getDatesInRange(range.start, range.end);
  const entries = dates.map((date) => ({ ...defaultDailyEntry, date, ...dailyEntries[date] }));
  const measurementEntries = Object.values(measurements)
    .filter((entry) => entry.date >= range.start && entry.date <= range.end)
    .sort((a, b) => a.date.localeCompare(b.date));

  const weights = entries.map((entry) => toNumber(entry.weight)).filter(Boolean);
  const steps = entries.map((entry) => toNumber(entry.steps)).filter(Boolean);
  const strains = entries.map((entry) => toNumber(entry.whoopStrain)).filter(Boolean);
  const energy = entries.map((entry) => parseInt(entry.usableEnergy, 10)).filter(Boolean);
  const latestMeasurement = measurementEntries.at(-1);

  const periodDays = entries.filter((entry) => entry.periodToday === 'Yes').map((entry) => entry.date);
  const allPeriodDays = Object.values(dailyEntries)
    .filter((entry) => entry.periodToday === 'Yes')
    .map((entry) => entry.date)
    .sort();

  return {
    entries,
    measurements: measurementEntries,
    resistanceSessions: entries.filter((entry) => entry.resistanceTraining === 'Yes').length,
    completedPlannedWorkouts: entries.filter((entry) => entry.plannedWorkout === 'Planned - completed').length,
    missedPlannedWorkouts: entries.filter((entry) => entry.plannedWorkout === 'Planned - missed').length,
    cardioSessions: entries.filter((entry) => toNumber(entry.cardioMinutes) > 0).length,
    totalCardioMinutes: sum(entries.map((entry) => toNumber(entry.cardioMinutes))),
    averageSteps: average(steps),
    averageStrain: average(strains, 1),
    averageEnergy: average(energy, 1),
    disruptedSleepNights: entries.filter((entry) => entry.sleepDisruption && entry.sleepDisruption !== 'No').length,
    poorSleepNights: entries.filter((entry) => ['Poor', 'Very poor'].includes(entry.sleepQuality)).length,
    commonSleepDisruption: mostCommon(entries.map((entry) => entry.sleepDisruption).filter((value) => value && value !== 'No')),
    highLoadDays: entries.filter((entry) => ['Very high', 'Extreme'].includes(entry.parentingLoad)).length,
    foodCounts: countBy(entries.map((entry) => entry.foodConsistency).filter(Boolean)),
    commonFoodBarrier: mostCommon(entries.map((entry) => entry.foodBarrier).filter((value) => value && value !== 'Nothing obvious')),
    latestWeight: latestValue(entries, 'weight', 'lb'),
    averageWeight: average(weights, 1) ? `${average(weights, 1)} lb` : '',
    latestWaist: latestMeasurement?.waist ? `${latestMeasurement.waist} in` : '',
    latestHips: latestMeasurement?.hips ? `${latestMeasurement.hips} in` : '',
    periodDays: periodDays.length,
    preBleedNote: getPreBleedNote(dailyEntries, allPeriodDays),
  };
}

function formatDailyExport(entry) {
  return `DAILY COACHING CHECK-IN

Date: ${entry.date}
Scale weight: ${entry.weight || 'Not logged'} lb
Sleep quality: ${entry.sleepQuality || 'Not logged'}
Sleep disruption: ${entry.sleepDisruption || 'Not logged'}
Usable energy: ${entry.usableEnergy || 'Not logged'}
Parenting / life load: ${entry.parentingLoad || 'Not logged'}
Symptoms: ${formatList(entry.symptoms)}
Capacity impact: ${entry.capacityImpact || 'Not logged'}
Hunger: ${entry.hunger || 'Not logged'}
Cravings: ${entry.cravings || 'Not logged'}
Food consistency: ${entry.foodConsistency || 'Not logged'}
Main food barrier: ${entry.foodBarrier || 'Not logged'}
Planned workout: ${entry.plannedWorkout || 'Not logged'}
Resistance training: ${entry.resistanceTraining || 'Not logged'}
Cardio minutes: ${entry.cardioMinutes || '0'}
Steps: ${entry.steps || 'Not logged'}
Whoop strain: ${entry.whoopStrain || 'Not logged'}
Movement felt: ${entry.movementFelt || 'Not logged'}
Period today: ${entry.periodToday || 'Not logged'}
Notes: ${entry.notes || 'None'}

Please give supportive feedback for today. Do not change the whole plan from one day of data. If useful, suggest one small action for tomorrow.`;
}

function formatWeeklyExport(weeklyData, range) {
  const lines = weeklyData.entries.map((entry) =>
    `${entry.date}: weight ${entry.weight || '-'} lb, energy ${entry.usableEnergy || '-'}, sleep ${entry.sleepQuality || '-'} / ${entry.sleepDisruption || '-'}, load ${entry.parentingLoad || '-'}, hunger ${entry.hunger || '-'}, cravings ${entry.cravings || '-'}, food ${entry.foodConsistency || '-'}, barrier ${entry.foodBarrier || '-'}, workout ${entry.plannedWorkout || '-'}, resistance ${entry.resistanceTraining || '-'}, cardio ${entry.cardioMinutes || '0'} min, steps ${entry.steps || '-'}, strain ${entry.whoopStrain || '-'}, period ${entry.periodToday || '-'}, symptoms ${formatList(entry.symptoms)}, notes ${entry.notes || 'None'}`,
  );

  const measurementLines = weeklyData.measurements.length
    ? weeklyData.measurements.map((entry) => `${entry.date}: waist ${entry.waist || '-'} in, hips ${entry.hips || '-'} in, context ${formatList(entry.context)}, notes ${entry.notes || 'None'}`)
    : ['No tape measurements logged this week.'];

  return `SUNDAY WEEKLY REVIEW

Dates covered: ${range.start} to ${range.end}

WEEKLY SUMMARY
Resistance sessions: ${weeklyData.resistanceSessions}
Planned workouts completed: ${weeklyData.completedPlannedWorkouts}
Planned workouts missed: ${weeklyData.missedPlannedWorkouts}
Cardio sessions: ${weeklyData.cardioSessions}
Total cardio minutes: ${weeklyData.totalCardioMinutes}
Average daily steps: ${weeklyData.averageSteps || 'Not enough data'}
Average Whoop strain: ${weeklyData.averageStrain || 'Not enough data'}
Average usable energy: ${weeklyData.averageEnergy || 'Not enough data'}
Disrupted sleep nights: ${weeklyData.disruptedSleepNights}
Poor / very poor sleep nights: ${weeklyData.poorSleepNights}
Most common sleep disruption: ${weeklyData.commonSleepDisruption || 'None obvious'}
High parenting / life load days: ${weeklyData.highLoadDays}
Most common food barrier: ${weeklyData.commonFoodBarrier || 'None obvious'}
Latest weight: ${weeklyData.latestWeight || 'Not logged'}
7-day average weight: ${weeklyData.averageWeight || 'Not enough data'}
Latest waist: ${weeklyData.latestWaist || 'Not logged'}
Latest hips: ${weeklyData.latestHips || 'Not logged'}
Period days logged this week: ${weeklyData.periodDays}

DAILY DATA
${lines.join('\n')}

TAPE MEASUREMENTS
${measurementLines.join('\n')}

PRE-BLEED WINDOW
${weeklyData.preBleedNote}

Please analyse this as a weekly review. Look for patterns over time, not single-day changes. Give 1-3 practical suggestions, but choose one realistic focus for next week.`;
}

const chatGptPrompt = `You are analysing a personal training client's health, weight-loss and training tracker data.

Be supportive, practical and non-judgemental. Do not shame the client about food, body weight, missed training, low steps, cravings, tiredness or difficult days.

Use daily exports for light coaching and encouragement. Do not make major plan changes from one day of data.

Use Sunday weekly review exports for pattern analysis and next-week decisions. Weekly changes are preferred unless there is an obvious safety, recovery or consistency issue.

Look for patterns over time across scale weight trends, tape measurements, sleep disruption, parenting/life load, illness, usable energy, hunger, cravings, symptoms, food consistency, steps, resistance training, cardio, Whoop strain, period days and possible pre-bleed patterns.

The client has a young child, so disrupted sleep, illness exposure, high parenting load and inconsistent routines may affect food consistency, cravings, training, recovery and weight change.

The client is on the pill. Do not assume a definite natural luteal phase. Look for recurring changes in the 7-14 days before logged "Period today = Yes" days. Refer to this as the "pre-bleed window".

Treat symptoms such as heaviness, overwhelm, brain fog, irritability, low motivation, feeling ill, scatteredness or physical depletion as capacity and resilience signals. Do not diagnose.

For Sunday reviews, answer:
1. What patterns are showing up?
2. What may be getting in the way of fat loss or consistency?
3. What seems to help?
4. Are sleep disruption, parenting/life load, illness, hunger, cravings, strain or pre-bleed timing affecting consistency?
5. Is she challenging herself enough across the week for her workout and weight-loss goals?
6. What is one realistic focus for next week?

Keep recommendations simple. Suggest no more than 1-3 practical changes at a time.`;

function getSundayReviewRange(dateIso) {
  const date = new Date(`${dateIso}T12:00:00`);
  const day = date.getDay();
  const end = new Date(date);
  end.setDate(date.getDate() + (7 - day) % 7);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start: toIso(start), end: toIso(end) };
}

function getDatesInRange(startIso, endIso) {
  const dates = [];
  const current = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  while (current <= end) {
    dates.push(toIso(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getPreBleedNote(dailyEntries, periodDays) {
  if (periodDays.length < 1) {
    return 'No period days logged yet. Once there are period days, review the 7-14 days before them as the pre-bleed window.';
  }

  const windows = periodDays.map((periodDate) => {
    const end = addDays(periodDate, -1);
    const start = addDays(periodDate, -14);
    const entries = getDatesInRange(start, end)
      .map((date) => dailyEntries[date])
      .filter(Boolean);
    return { periodDate, entries };
  });

  const totalWindowEntries = windows.reduce((count, window) => count + window.entries.length, 0);
  if (totalWindowEntries < 7) {
    return 'Some period data exists, but there is not enough pre-bleed window data yet for a reliable pattern.';
  }

  return 'Pre-bleed window data exists. Ask ChatGPT to compare food consistency, cravings, hunger, usable energy, symptoms, steps, training, strain, sleep and weight in the 7-14 days before period days.';
}

function addDays(dateIso, days) {
  const date = new Date(`${dateIso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

function toIso(date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(dateIso) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${dateIso}T12:00:00`));
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values, decimals = 0) {
  if (!values.length) return '';
  const result = sum(values) / values.length;
  return Number(result.toFixed(decimals)).toLocaleString('en-GB');
}

function countBy(values) {
  return values.reduce((counts, value) => ({ ...counts, [value]: (counts[value] || 0) + 1 }), {});
}

function mostCommon(values) {
  const counts = countBy(values);
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function latestValue(entries, field, unit) {
  const value = [...entries].reverse().find((entry) => entry[field])?.[field];
  return value ? `${value} ${unit}` : '';
}

function formatList(values = []) {
  return values.length ? values.join(', ') : 'None logged';
}
