import React, { useState, useRef, useEffect } from 'react';
import { CalculatorInputs, CalculatorResults } from '../types/calculator';
import {
  Info,
  CheckCircle2,
  Cpu,
  Zap,
  Activity,
  ShieldCheck,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Maximize2,
} from 'lucide-react';

interface SchematicViewProps {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

export const SchematicView: React.FC<SchematicViewProps> = ({
  inputs,
  results,
}) => {
  const [selectedPinOrPart, setSelectedPinOrPart] = useState<string>('MODE');
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    hasMoved: boolean;
  }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
    hasMoved: false,
  });

  const touchStartRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    dist: number;
    startScale: number;
  }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
    dist: 0,
    startScale: 1,
  });

  // Native wheel listener on container to allow zoom without scrolling page
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      setScale((prevScale) => {
        const nextScale = Math.min(Math.max(prevScale * zoomFactor, 0.5), 3.5);
        const ratio = nextScale / prevScale;
        setPan((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * ratio,
          y: mouseY - (mouseY - prevPan.y) * ratio,
        }));
        return Number(nextScale.toFixed(2));
      });
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNative);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
      hasMoved: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 4) {
      dragStartRef.current.hasMoved = true;
    }
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: pan.x,
        panY: pan.y,
        hasMoved: false,
      };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
        panX: pan.x,
        panY: pan.y,
        dist,
        startScale: scale,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 4) {
        dragStartRef.current.hasMoved = true;
      }
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / (touchStartRef.current.dist || 1);
      const nextScale = Math.min(Math.max(touchStartRef.current.startScale * ratio, 0.5), 3.5);
      setScale(Number(nextScale.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleItemClick = (key: string) => {
    if (dragStartRef.current.hasMoved) return;
    setSelectedPinOrPart(key);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(Number((prev * 1.25).toFixed(2)), 3.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(Number((prev * 0.8).toFixed(2)), 0.5));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const getPinOrPartDetail = (id: string) => {
    switch (id) {
      case 'MODE':
      case 'PIN_27':
        return {
          pin: 'Пин 27: MODE',
          title: 'Выбор режима работы и питания драйвера',
          value: `R_MODE = ${results.rmodeKohm.formatted} (E96 1%)`,
          modeText: results.modeDescription,
          detail: 'Резистор R_MODE, подключенный между выводом 27 (MODE) и аналоговой землей AGND, конфигурирует режим работы внутреннего ШИМ-контроллера и источника питания драйверов затворов (Таблица 1, стр. 9 даташита):',
          table: [
            { mode: 'Mode 1', res: '2.0 kΩ (или AGND)', desc: 'Power Save Mode (PSM) включен, внутренний регулятор VDRV 5V включен.' },
            { mode: 'Mode 2', res: '301 kΩ (1%)', desc: 'Forced Continuous Conduction (FCCM) непрерывный режим, внутренний VDRV 5V включен.' },
            { mode: 'Mode 3', res: '499 kΩ (1%)', desc: 'FCCM непрерывный режим, внутренний LDO выключен, питание VDRV от внешней шины 5V.' },
            { mode: 'Mode 4', res: '1000 kΩ (1 MΩ, 1%)', desc: 'PSM энергосберегающий режим, внутренний LDO выключен, питание VDRV от внешней 5V.' },
          ],
          layoutNote: 'Трассировать резистор R_MODE непосредственно к выводу 27 и тихой земле AGND (вывод 17/23). Не прокладывать рядом с импульсным узлом SW.',
        };
      case 'FSW':
      case 'PIN_24':
        return {
          pin: 'Пин 24: fSW',
          title: 'Программирование частоты переключения',
          value: `R_FSW = ${results.rfswKohm.formatted} → Fsw = ${results.actualFswKhz} кГц`,
          formula: 'Rfsw = Vout / (fsw · 1.9e-10)',
          detail: `Задает время открытого состояния верхнего ключа ton, пропорциональное выходному напряжению Vout. Для fsw = ${results.actualFswKhz} кГц и Vout = ${results.voutActual} В расчетное значение Rfsw = ${results.rfswKohm.theoretical} кОм. Ближайший стандарт E96 — ${results.rfswKohm.nominal} кОм.`,
          layoutNote: 'Резистор R_FSW подключается между выводом 24 и AGND. Трассировка должна быть минимальной длины в экранированном слое.',
        };
      case 'PHASE':
      case 'PIN_5_6':
      case 'BOOT':
      case 'PIN_4':
        return {
          pin: 'Пины 4 (BOOT) и 5, 6 (PHASE1, PHASE2)',
          title: 'Бутстрепная накачка и демпфирование dV/dt',
          value: `C_BOOT = ${results.cbootNf.formatted}, R_BOOT = ${results.rbootOhm.formatted}`,
          detail: 'Питает плавающий драйвер верхнего силового MOSFET. Керамический конденсатор C_BOOT (100 нФ X7R ≥25В) включается последовательно с резистором R_BOOT (3.3 Ω для SiC461/462, 4.7 Ω для SiC463/464) между выводом BOOT и выводами PHASE1/PHASE2.',
          layoutNote: 'КРИТИЧНО ДЛЯ EMI: Резистор R_BOOT демпфирует крутизну фронтов переключения dV/dt и гасит звон в узле фазы. Возвратный проводник от C_BOOT/R_BOOT должен подключаться строго к выводам PHASE1/2 (5, 6), а не к силовым выводам SW (7-10)!',
        };
      case 'VDRV':
      case 'PIN_16':
        return {
          pin: 'Пин 16: VDRV',
          title: 'Питание драйверов силовых ключей',
          value: `C_VDRV = ${results.cvdrvUf.formatted}`,
          detail: `Напряжение шины питания затворов (5.0 В). ${results.vdrvSupplySource}. Потери в кристалле: ${results.vdrvPowerLossW} Вт. В режимах Mode 3 и 4 при питании VDRV от внешней шины 5В (или от выхода Vout, если Vout=5В) полностью исключаются потери в линейном стабилизаторе, что дает выигрыш в КПД до 3-5% и снижает нагрев кристалла.`,
          layoutNote: 'Керамический конденсатор C_VDRV = 4.7 µF (X7R 10V+) монтируется прямо у вывода 16 и вывода 15 PGND с минимальной паразитной индуктивностью контура.',
        };
      case 'COMP':
      case 'PIN_21':
        return {
          pin: 'Пин 21: COMP',
          title: 'Частотная коррекция транскондуктивного усилителя ошибки',
          value: `R_COMP = ${results.rcompKohm.formatted}, C_COMP = ${results.ccompPf.formatted}`,
          formula: 'fc ≈ fsw / 10, gm = 300 µS',
          detail: `Внутренний транскондуктивный усилитель ошибки (gm = 300 µS) стабилизирует выходное напряжение. Расчетная частота среза петли fc = ${results.crossoverFreqKhz} кГц. Двойной LC-полюс выходного фильтра расположен на частоте f_LC = ${results.lcPoleFreqKhz} кГц. Последовательная RC-цепочка R_COMP + C_COMP формирует нуль компенсации.`,
          layoutNote: 'Подключается к выводу COMP (21) и возвращается на аналоговую землю AGND. Должна быть удалена от силовых трасс SW и дросселя.',
        };
      case 'VSNS':
      case 'PIN_20':
        return {
          pin: 'Пин 20: VSNS',
          title: 'Инжекция пилы для устойчивости COT (Constant On-Time)',
          value: `Rx = ${results.rxKohm.formatted}, Cx = ${results.cxNf.formatted}, Cy = ${results.cyNf.formatted} → Vramp = ${results.vrampMv} мВ`,
          formula: 'Vramp = ((Vin - Vout) · Vout) / (Vin · fsw · Cx · Rx)',
          detail: `Поскольку современные керамические конденсаторы MLCC имеют сверхнизкий ESR, естественной пилы на выходе недостаточно для работы компаратора COT. Цепь Rx (от узла SW), Cx и Cy инжектирует внутреннюю синтезированную пилу в узел VSNS. Оптимальный диапазон амплитуды: 100 .. 900 мВ (расчетное: ${results.vrampMv} мВ).`,
          layoutNote: 'Резистор Rx рассеивает до 25 мВт (типоразмер 0603). Сигнал VSNS снимается кельвиновским подключением.',
        };
      case 'L1':
      case 'SW':
      case 'PIN_7_10':
        return {
          pin: 'Пины 7, 8, 9, 10: SW',
          title: 'Силовой импульсный узел переключения и дроссель L1',
          value: `L1 = ${results.lNominal.formatted} (расчетное: ${results.lCalcUh} µH)`,
          detail: `Рейтинг дросселя: Isat ≥ ${(results.iPeak * 1.3).toFixed(1)} A, Irms ≥ ${(results.iRms * 1.15).toFixed(1)} A. Размах пульсаций тока дросселя ΔIL = ${results.actualDeltaIL} A (${(results.actualKind * 100).toFixed(0)}% от Iout). Потери в активном сопротивлении меди DCR ≈ ${results.inductorDcrLossW} Вт.`,
          layoutNote: 'Полигон SW должен иметь минимально необходимую площадь для уменьшения емкостной связи и EMI излучения, но достаточную медь для отвода тепла (минимум 2 oz).',
        };
      case 'VFB':
      case 'PIN_22':
        return {
          pin: 'Пин 22: VFB',
          title: 'Вход обратной связи по напряжению',
          value: `R_FB_H = ${results.rfbTop.formatted}, R_FB_L = ${results.rfbBottom.formatted}, C_FF = ${results.cffPf?.formatted || '22 pF'}`,
          formula: 'Vout = Vref · (1 + R_FB_H / R_FB_L), Vref = 0.800 В',
          detail: `Фактическое выходное напряжение: ${results.voutActual} В (погрешность ${results.voutErrorPercent > 0 ? '+' : ''}${results.voutErrorPercent}%). Конденсатор опережения C_FF, включенный параллельно верхнему резистору, повышает запас по фазе до > 55°.`,
          layoutNote: 'Вывод VFB является высокоомным чувствительным узлом. Дорожка от делителя к выводу 22 должна быть максимально короткой и экранирована земляным полигоном.',
        };
      case 'SS':
      case 'PIN_19':
        return {
          pin: 'Пин 19: SS',
          title: 'Программирование плавного пуска (Soft-Start)',
          value: `C_SS = ${results.cssNf.formatted} (E24) → Tss = ${results.actualTssMs} мс`,
          formula: 'Tss = (Css · 0.8В) / 5.0 µA',
          detail: `Внутренний источник тока 5 мкА заряжает конденсатор CSS, обеспечивая плавное монотонное нарастание выходного напряжения без бросков пускового тока.`,
          layoutNote: 'Конденсатор монтируется между выводом 19 и AGND.',
        };
      case 'EN':
      case 'PIN_3':
        return {
          pin: 'Пин 3: EN',
          title: 'Разрешение работы и настраиваемая защита UVLO',
          value: `REN1 = ${results.renTopKohm.formatted}, REN2 = ${results.renBottomKohm.formatted}`,
          formula: 'Vin_start = 1.20В · (1 + REN1/REN2), Vin_stop = 1.10В · (1 + REN1/REN2)',
          detail: `Порог включения: Vin_start = ${results.actualVinStart} В. Порог отключения: Vin_stop = ${results.actualVinStop} В. Встроенный гистерезис компаратора EN равен ровно 100 мВ, что гарантирует уверенный пуск без дребезга.`,
          layoutNote: 'Резистор REN1 подключается к шине VIN, REN2 — к AGND.',
        };
      case 'ILIMIT':
      case 'PIN_25':
        return {
          pin: 'Пин 25: ILIMIT',
          title: 'Программирование токового предела нижнего ключа',
          value: `R_LIM = ${results.rlimKohm.formatted} → Ivalley ≈ ${results.ilimNominalA} А`,
          formula: `Rlim (kΩ) = Klim / Ivalley (Klim = ${results.klimValue}k для ${inputs.chipModel})`,
          detail: `Поцикловая защита от короткого замыкания и перегрузки по току, измеряющая падение напряжения на нижнем MOSFET в проводящем состоянии.`,
          layoutNote: 'Резистор R_LIM подключается между выводом 25 и AGND.',
        };
      case 'VCIN':
      case 'PIN_1':
        return {
          pin: 'Пин 1: VCIN',
          title: 'Питание управляющей схемы микросхемы',
          value: `C_VCIN = ${results.cvcinUf.formatted}, R_VCIN = ${results.rvcinOhm.formatted}`,
          detail: 'Подает входное напряжение 4.5В .. 60В на внутренние линейные стабилизаторы логики. Развязывается RC-фильтром (0..2.2 Ω и 0.1 µF к AGND) для подавления импульсных помех с силовой шины VIN.',
          layoutNote: 'Конденсатор C_VCIN ставить вплотную к выводу 1 и тихой земле.',
        };
      case 'VDD':
      case 'PIN_26':
        return {
          pin: 'Пин 26: VDD',
          title: 'Внутренняя шина питания логики 5.0В',
          value: `C_VDD = ${results.cddUf.formatted}`,
          detail: 'Выход внутреннего линейного регулятора 5В для питания аналоговых блоков и компараторов. Требует локального керамического конденсатора 1.0 µF к AGND.',
          layoutNote: 'Не нагружать внешними потребителями тока более 5 мА.',
        };
      case 'PGOOD':
      case 'PIN_2':
        return {
          pin: 'Пин 2: PGOOD',
          title: 'Сигнал исправности выходного напряжения (Power Good)',
          value: `R_PGOOD = ${results.rpgoodKohm.formatted}`,
          detail: 'Выход с открытым стоком. Подтягивается резистором 100..102 кОм к шине VDD или логической шине 3.3В / 5В. Сигнал активен (HIGH), когда Vout находится в пределах 90% .. 110% от номинала.',
          layoutNote: 'Может объединяться по схеме "монтажное ИЛИ" с другими источниками питания.',
        };
      case 'CIN':
        return {
          pin: 'Входная батарея CIN',
          title: 'Входные конденсаторы подавления ВЧ пульсаций',
          value: `${results.cinQty} × ${results.cinSingleUf} µF (${results.cinQty * results.cinSingleUf} µF)`,
          detail: `Суммарный RMS ток через конденсаторы: ${results.cinRmsA} A. Рабочее напряжение ≥ ${Math.ceil(inputs.vinMax * 1.35)} В.`,
          layoutNote: 'Устанавливать непосредственно между силовыми полигонами VIN и выводами 11-15 PGND с минимальной паразитной индуктивностью контура импульсного тока.',
        };
      case 'COUT':
        return {
          pin: 'Выходная батарея COUT',
          title: 'Выходные сглаживающие конденсаторы',
          value: `${results.coutQty} × ${results.coutSingleUf} µF (${results.coutQty * results.coutSingleUf} µF)`,
          detail: `Мин. эффективная емкость: ${results.coutEffectiveMinUf} µF (по пульсациям ${results.coutRippleMinUf} µF, по набросу тока ${results.coutTransientMinUf} µF). Расчетные пульсации Vout ≈ ${results.actualRippleMv} мВ.`,
          layoutNote: 'Монтировать полигоном к выходу дросселя L1 и силовым полигонам PGND.',
        };
      default:
        return null;
    }
  };

  const activeDetail = getPinOrPartDetail(selectedPinOrPart);

  const pinsList = [
    { id: 'PIN_27', label: 'Пин 27: MODE', key: 'MODE', color: 'text-cyan-400' },
    { id: 'PIN_24', label: 'Пин 24: fSW', key: 'FSW', color: 'text-cyan-400' },
    { id: 'PIN_5_6', label: 'Пины 5,6: PHASE', key: 'PHASE', color: 'text-amber-400' },
    { id: 'PIN_4', label: 'Пин 4: BOOT', key: 'BOOT', color: 'text-amber-400' },
    { id: 'PIN_16', label: 'Пин 16: VDRV', key: 'VDRV', color: 'text-purple-400' },
    { id: 'PIN_21', label: 'Пин 21: COMP', key: 'COMP', color: 'text-emerald-400' },
    { id: 'PIN_20', label: 'Пин 20: VSNS', key: 'VSNS', color: 'text-cyan-400' },
    { id: 'PIN_7_10', label: 'Пины 7-10: SW', key: 'SW', color: 'text-amber-400' },
    { id: 'PIN_22', label: 'Пин 22: VFB', key: 'VFB', color: 'text-purple-400' },
    { id: 'PIN_19', label: 'Пин 19: SS', key: 'SS', color: 'text-cyan-400' },
    { id: 'PIN_3', label: 'Пин 3: EN', key: 'EN', color: 'text-cyan-400' },
    { id: 'PIN_25', label: 'Пин 25: ILIMIT', key: 'ILIMIT', color: 'text-amber-400' },
    { id: 'PIN_1', label: 'Пин 1: VCIN', key: 'VCIN', color: 'text-slate-300' },
    { id: 'PIN_26', label: 'Пин 26: VDD', key: 'VDD', color: 'text-slate-300' },
    { id: 'PIN_2', label: 'Пин 2: PGOOD', key: 'PGOOD', color: 'text-slate-300' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-5 overflow-y-auto">
      {/* Top summary card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-lg mb-3 text-xs">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-slate-400 block text-[11px]">Входное напряжение:</span>
            <span className="font-mono text-white font-semibold">
              {inputs.vinMin}В .. <span className="text-cyan-400">{inputs.vinNom}В</span> .. {inputs.vinMax}В
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Выходной режим:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {results.voutActual} В @ {inputs.ioutMax} А
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Дроссель L1:</span>
            <span className="font-mono text-amber-300 font-bold text-sm">
              {results.lNominal.nominal} µH
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Конфигурация MODE:</span>
            <span className="font-mono text-cyan-300 font-bold text-xs">
              Mode {results.detectedMode} ({results.rmodeKohm.formatted})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Частота fSW:</span>
            <span className="font-mono text-cyan-400 font-bold text-xs">
              {results.actualFswKhz} кГц ({results.rfswKohm.formatted})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded font-mono border border-slate-700">
            Схема из даташита (стр. 10, Рис. 10)
          </span>
        </div>
      </div>

      {/* Pin Quick Selector Toolbar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs">
        <span className="text-slate-400 text-[11px] font-mono shrink-0 mr-1">Пины SiC46x:</span>
        {pinsList.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPinOrPart(p.key)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono shrink-0 transition-colors border ${
              selectedPinOrPart === p.key
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* SVG Circuit Schematic Canvas Container with Interactive Zoom & Pan */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative bg-slate-900/95 border border-slate-800 rounded-lg min-h-[540px] flex items-center justify-center overflow-hidden shadow-inner select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Floating Zoom & Pan Controls HUD */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-1.5 shadow-xl select-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            title="Уменьшить масштаб (Колесико вниз)"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResetZoom();
            }}
            title="Сбросить масштаб (100%)"
            className="px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 hover:bg-slate-800 rounded transition-colors"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            title="Увеличить масштаб (Колесико вверх)"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResetZoom();
            }}
            title="Сбросить позицию и масштаб"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Left Hint */}
        <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400 px-3 py-1.5 rounded-md pointer-events-none shadow-md select-none">
          <Move className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Колесико мыши: масштаб ({Math.round(scale * 100)}%) • Зажать ЛКМ: перемещение схемы</span>
        </div>

        {/* Scalable and Pannable SVG Canvas */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.08s ease-out',
          }}
          className="w-full h-full flex items-center justify-center pointer-events-auto"
        >
          <svg
            viewBox="0 0 1140 700"
            className="w-full max-w-[1140px] h-auto select-none font-sans"
          >
            <defs>
              <linearGradient id="icGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>

            <rect width="1140" height="700" fill="url(#smallGrid)" opacity="0.4" />

            {/* ===================== CLEARANCE CORRIDORS (SW to VSNS & VOUT Feedback) ===================== */}
            {/* Top clearance corridor for SW sensing to VSNS Rx without crossing IC */}
            <g className="cursor-pointer" onClick={() => handleItemClick('VSNS')}>
              <path
                d="M 760 220 L 760 38 L 75 38 L 75 355 L 100 355"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.85"
              />
              <rect x="350" y="28" width="160" height="18" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              <text x="430" y="41" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="JetBrains Mono">
                SW импульсный узел → Rx (VSNS)
              </text>
            </g>

            {/* Bottom clearance corridor for VOUT feedback to RFB1 / CFF without crossing COUT GND */}
            <g className="cursor-pointer" onClick={() => handleItemClick('VFB')}>
              <path
                d="M 120 455 L 120 665 L 1040 665 L 1040 225"
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.85"
              />
              <rect x="740" y="655" width="180" height="18" rx="3" fill="#0f172a" stroke="#c084fc" strokeWidth="1" />
              <text x="830" y="668" textAnchor="middle" fill="#c084fc" fontSize="9" fontFamily="JetBrains Mono">
                Обратная связь VOUT → RFB1 / Cy
              </text>
            </g>

            {/* ===================== CENTRAL IC: SiC461 (MLP55-27L) ===================== */}
            <g>
              <rect
                x="380"
                y="70"
                width="320"
                height="520"
                rx="8"
                fill="url(#icGrad)"
                stroke="#0284c7"
                strokeWidth="2.5"
              />
              {/* IC Orientation Notch */}
              <circle cx="400" cy="90" r="6" fill="#0284c7" opacity="0.8" />
              
              <text x="540" y="275" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="16" letterSpacing="1">
                Vishay {inputs.chipModel || 'SiC461'}
              </text>
              <text x="540" y="298" textAnchor="middle" fill="#38bdf8" fontSize="12" fontFamily="JetBrains Mono">
                microBUCK® 60V {results.maxRatedCurrentA}A Synchronous Buck
              </text>
              <text x="540" y="318" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">
                Корпус PowerPAK® MLP55-27L (стр. 10 даташита)
              </text>
              <text x="540" y="338" textAnchor="middle" fill="#34d399" fontSize="10" fontFamily="JetBrains Mono">
                Mode {results.detectedMode} • {results.actualFswKhz} кГц • Vref = 0.800В
              </text>

              {/* LEFT PINS (1, 2, 3, 18, 19, 20, 21, 22, 24, 25, 27) */}
              {/* Pin 1: VCIN */}
              <g className="cursor-pointer" onClick={() => handleItemClick('VCIN')}>
                <line x1="320" y1="100" x2="380" y2="100" stroke="#38bdf8" strokeWidth="2" />
                <text x="390" y="104" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">1: VCIN</text>
              </g>

              {/* Pin 2: PGOOD */}
              <g className="cursor-pointer" onClick={() => handleItemClick('PGOOD')}>
                <line x1="320" y1="140" x2="380" y2="140" stroke="#94a3b8" strokeWidth="2" />
                <text x="390" y="144" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">2: PGOOD</text>
              </g>

              {/* Pin 3: EN */}
              <g className="cursor-pointer" onClick={() => handleItemClick('EN')}>
                <line x1="320" y1="180" x2="380" y2="180" stroke="#38bdf8" strokeWidth="2" />
                <text x="390" y="184" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">3: EN / UVLO</text>
              </g>

              {/* Pin 18: ULTRASONIC */}
              <g className="cursor-pointer" onClick={() => handleItemClick('MODE')}>
                <line x1="320" y1="225" x2="380" y2="225" stroke="#94a3b8" strokeWidth="2" />
                <text x="390" y="229" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">18: ULTRASONIC</text>
              </g>

              {/* Pin 19: SS */}
              <g className="cursor-pointer" onClick={() => handleItemClick('SS')}>
                <line x1="320" y1="265" x2="380" y2="265" stroke="#38bdf8" strokeWidth="2" />
                <text x="390" y="269" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">19: SS (5µA)</text>
              </g>

              {/* Pin 20: VSNS */}
              <g className="cursor-pointer" onClick={() => handleItemClick('VSNS')}>
                <line x1="320" y1="355" x2="380" y2="355" stroke="#38bdf8" strokeWidth="2" />
                <text x="390" y="359" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">20: VSNS (Пила)</text>
              </g>

              {/* Pin 21: COMP */}
              <g className="cursor-pointer" onClick={() => handleItemClick('COMP')}>
                <line x1="320" y1="405" x2="380" y2="405" stroke="#34d399" strokeWidth="2" />
                <text x="390" y="409" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">21: COMP (gm)</text>
              </g>

              {/* Pin 22: VFB */}
              <g className="cursor-pointer" onClick={() => handleItemClick('VFB')}>
                <line x1="320" y1="455" x2="380" y2="455" stroke="#c084fc" strokeWidth="2" />
                <text x="390" y="459" fill="#c084fc" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">22: VFB (0.8V)</text>
              </g>

              {/* Pin 24: FSW */}
              <g className="cursor-pointer" onClick={() => handleItemClick('FSW')}>
                <line x1="320" y1="505" x2="380" y2="505" stroke="#38bdf8" strokeWidth="2" />
                <text x="390" y="509" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">24: fSW (Частота)</text>
              </g>

              {/* Pin 25: ILIMIT */}
              <g className="cursor-pointer" onClick={() => handleItemClick('ILIMIT')}>
                <line x1="320" y1="545" x2="380" y2="545" stroke="#fbbf24" strokeWidth="2" />
                <text x="390" y="549" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">25: ILIMIT</text>
              </g>

              {/* Pin 27: MODE */}
              <g className="cursor-pointer" onClick={() => handleItemClick('MODE')}>
                <line x1="320" y1="575" x2="380" y2="575" stroke="#38bdf8" strokeWidth="2" />
                <text x="390" y="579" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">27: MODE</text>
              </g>

              {/* RIGHT PINS (4, 5, 6, 7-10, 16, 26) */}
              {/* Pin 4: BOOT */}
              <g className="cursor-pointer" onClick={() => handleItemClick('BOOT')}>
                <line x1="700" y1="105" x2="760" y2="105" stroke="#fbbf24" strokeWidth="2.5" />
                <text x="690" y="109" textAnchor="end" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">4: BOOT</text>
              </g>

              {/* Pins 5, 6: PHASE1, PHASE2 */}
              <g className="cursor-pointer" onClick={() => handleItemClick('PHASE')}>
                <line x1="700" y1="150" x2="760" y2="150" stroke="#fbbf24" strokeWidth="2.5" />
                <text x="690" y="154" textAnchor="end" fill="#fbbf24" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">5,6: PHASE1, 2</text>
              </g>

              {/* Pins 7, 8, 9, 10: SW */}
              <g className="cursor-pointer" onClick={() => handleItemClick('SW')}>
                <line x1="700" y1="220" x2="780" y2="220" stroke="#38bdf8" strokeWidth="4" />
                <text x="690" y="224" textAnchor="end" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">7-10: SW (Power)</text>
              </g>

              {/* Pin 16: VDRV */}
              <g className="cursor-pointer" onClick={() => handleItemClick('VDRV')}>
                <line x1="700" y1="380" x2="770" y2="380" stroke="#c084fc" strokeWidth="2.5" />
                <text x="690" y="384" textAnchor="end" fill="#c084fc" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">16: VDRV (5V Gate)</text>
              </g>

              {/* Pin 26: VDD */}
              <g className="cursor-pointer" onClick={() => handleItemClick('VDD')}>
                <line x1="700" y1="470" x2="770" y2="470" stroke="#94a3b8" strokeWidth="2" />
                <text x="690" y="474" textAnchor="end" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">26: VDD (5V Bias)</text>
              </g>

              {/* BOTTOM: Pins 11-15 PGND & 17, 23 AGND */}
              <line x1="470" y1="590" x2="470" y2="625" stroke="#64748b" strokeWidth="2" />
              <text x="470" y="583" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">17, 23: AGND</text>

              <line x1="610" y1="590" x2="610" y2="625" stroke="#0284c7" strokeWidth="4" />
              <text x="610" y="583" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">11-15: PGND</text>
              
              {/* Net Tie Star Ground */}
              <line x1="470" y1="625" x2="610" y2="625" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="540" y="642" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">
                Точка соединения земель (Net-Tie Star Ground)
              </text>
            </g>

            {/* ===================== INPUT VIN & CIN ===================== */}
            <line x1="40" y1="70" x2="320" y2="70" stroke="#38bdf8" strokeWidth="3" />
            <circle cx="40" cy="70" r="4.5" fill="#38bdf8" />
            <text x="40" y="52" fill="#38bdf8" fontSize="13" fontWeight="bold">VIN ({inputs.vinNom}В)</text>
            <text x="40" y="65" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">{inputs.vinMin}В .. {inputs.vinMax}В</text>

            {/* CIN: Input Capacitors */}
            <g className="cursor-pointer" onClick={() => handleItemClick('CIN')}>
              <circle cx="95" cy="70" r="3.5" fill="#38bdf8" />
              <line x1="95" y1="70" x2="95" y2="100" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="83" y="100" width="24" height="24" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="88" y1="110" x2="102" y2="110" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="88" y1="114" x2="102" y2="114" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="95" y1="124" x2="95" y2="142" stroke="#64748b" strokeWidth="1.5" />
              {/* PGND Ground Symbol */}
              <line x1="87" y1="142" x2="103" y2="142" stroke="#64748b" strokeWidth="2" />
              <line x1="90" y1="145" x2="100" y2="145" stroke="#64748b" strokeWidth="1.5" />
              <line x1="93" y1="148" x2="97" y2="148" stroke="#64748b" strokeWidth="1" />
              
              <text x="76" y="112" textAnchor="end" fill="#e2e8f0" fontSize="10" fontWeight="bold">CIN</text>
              <text x="76" y="124" textAnchor="end" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                {results.cinQty}×{results.cinSingleUf}µF
              </text>
            </g>

            {/* Pin 1 VCIN Filter (R_VCIN & C_VCIN) */}
            <g className="cursor-pointer" onClick={() => handleItemClick('VCIN')}>
              <circle cx="250" cy="70" r="3" fill="#38bdf8" />
              <line x1="250" y1="70" x2="250" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="250" y1="100" x2="320" y2="100" stroke="#38bdf8" strokeWidth="1.5" />
              {/* R_VCIN */}
              <rect x="242" y="75" width="16" height="18" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="238" y="87" textAnchor="end" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">
                {results.rvcinOhm.formatted}
              </text>
              {/* C_VCIN to AGND */}
              <line x1="280" y1="100" x2="280" y2="118" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="272" y="118" width="16" height="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="280" y1="134" x2="280" y2="144" stroke="#64748b" strokeWidth="1.5" />
              <line x1="274" y1="144" x2="286" y2="144" stroke="#64748b" strokeWidth="1.5" />
              <text x="294" y="129" textAnchor="start" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                {results.cvcinUf.formatted}
              </text>
            </g>

            {/* Pin 2 PGOOD Pull-up (R_PGOOD) */}
            <g className="cursor-pointer" onClick={() => handleItemClick('PGOOD')}>
              <line x1="280" y1="140" x2="320" y2="140" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="280" y1="140" x2="280" y2="120" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="272" y="120" width="16" height="18" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="280" y1="120" x2="280" y2="108" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="280" cy="108" r="2.5" fill="#94a3b8" />
              <text x="268" y="132" textAnchor="end" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">
                {results.rpgoodKohm.formatted}
              </text>
              <text x="280" y="104" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">
                +VDD
              </text>
            </g>

            {/* ===================== UVLO DIVIDER (REN1 & REN2) ON PIN 3 EN ===================== */}
            {/* Shows BOTH resistors clearly with active calculated or manual values */}
            <g className="cursor-pointer" onClick={() => handleItemClick('EN')}>
              <circle cx="190" cy="70" r="3.5" fill="#38bdf8" />
              <line x1="190" y1="70" x2="190" y2="95" stroke="#38bdf8" strokeWidth="1.5" />
              
              {/* REN1 (R_EN_H) */}
              <rect x="180" y="95" width="20" height="28" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="172" y="107" textAnchor="end" fill="#e2e8f0" fontSize="9" fontWeight="bold">REN1 (R_EN_H)</text>
              <text x="172" y="119" textAnchor="end" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                {results.renTopKohm.formatted}
              </text>

              {/* Wire through Pin 3 EN junction */}
              <line x1="190" y1="123" x2="190" y2="180" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="190" cy="180" r="3.5" fill="#38bdf8" />
              <line x1="190" y1="180" x2="320" y2="180" stroke="#38bdf8" strokeWidth="1.5" />

              {/* REN2 (R_EN_L) */}
              <line x1="190" y1="180" x2="190" y2="198" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="180" y="198" width="20" height="28" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="172" y="210" textAnchor="end" fill="#e2e8f0" fontSize="9" fontWeight="bold">REN2 (R_EN_L)</text>
              <text x="172" y="222" textAnchor="end" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                {results.renBottomKohm.formatted}
              </text>

              {/* AGND Return for REN2 */}
              <line x1="190" y1="226" x2="190" y2="242" stroke="#64748b" strokeWidth="1.5" />
              <line x1="182" y1="242" x2="198" y2="242" stroke="#64748b" strokeWidth="2" />
              <line x1="185" y1="245" x2="195" y2="245" stroke="#64748b" strokeWidth="1.5" />
              <text x="190" y="256" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">AGND</text>
            </g>

            {/* Pin 18: ULTRASONIC */}
            <g className="cursor-pointer" onClick={() => handleItemClick('MODE')}>
              <line x1="250" y1="225" x2="320" y2="225" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="250" cy="225" r="3" fill="#94a3b8" />
              <rect x="135" y="215" width="110" height="20" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
              <text x="190" y="228" textAnchor="middle" fill={inputs.ultrasonicEnabled ? '#38bdf8' : '#94a3b8'} fontSize="8" fontFamily="JetBrains Mono">
                {inputs.ultrasonicEnabled ? '→ VDD (>25кГц)' : '→ AGND (выкл)'}
              </text>
            </g>

            {/* Pin 19: SS Soft-Start Capacitor */}
            <g className="cursor-pointer" onClick={() => handleItemClick('SS')}>
              <line x1="320" y1="265" x2="260" y2="265" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="236" y="253" width="24" height="24" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="243" y1="261" x2="253" y2="261" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="243" y1="265" x2="253" y2="265" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="236" y1="265" x2="216" y2="265" stroke="#64748b" strokeWidth="1.5" />
              <line x1="216" y1="257" x2="216" y2="273" stroke="#64748b" strokeWidth="2" />
              <line x1="213" y1="260" x2="213" y2="270" stroke="#64748b" strokeWidth="1.5" />
              <text x="248" y="247" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold">C_SS</text>
              <text x="248" y="290" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                {results.cssNf.formatted} (Tss = {results.actualTssMs}мс)
              </text>
            </g>

            {/* Pin 20: VSNS Ripple Network (Rx, Cx, Cy) */}
            <g className="cursor-pointer" onClick={() => handleItemClick('VSNS')}>
              <line x1="320" y1="355" x2="240" y2="355" stroke="#38bdf8" strokeWidth="1.5" />
              <circle cx="240" cy="355" r="3.5" fill="#38bdf8" />
              
              {/* Cy between VSNS and VOUT sense line */}
              <line x1="240" y1="355" x2="240" y2="370" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="228" y="370" width="24" height="20" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="240" y="365" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                Cy={results.cyNf.formatted}
              </text>
              <line x1="240" y1="390" x2="240" y2="400" stroke="#c084fc" strokeWidth="1.5" />
              <line x1="240" y1="400" x2="120" y2="400" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 2" />

              {/* Cx in series from VSNS */}
              <line x1="240" y1="355" x2="185" y2="355" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="160" y="344" width="25" height="22" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="172" y="338" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                Cx={results.cxNf.formatted}
              </text>

              {/* Rx in series from SW sensing corridor */}
              <line x1="160" y1="355" x2="130" y2="355" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="100" y="344" width="30" height="22" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="115" y="338" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                Rx={results.rxKohm.formatted}
              </text>
              <line x1="100" y1="355" x2="75" y2="355" stroke="#38bdf8" strokeWidth="1.5" />

              <text x="150" y="380" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">
                Vramp = {results.vrampMv} мВ (COT)
              </text>
            </g>

            {/* Pin 21: COMP Loop Compensation (R_COMP + C_COMP) */}
            <g className="cursor-pointer" onClick={() => handleItemClick('COMP')}>
              <line x1="320" y1="405" x2="265" y2="405" stroke="#34d399" strokeWidth="1.5" />
              {/* R_COMP */}
              <rect x="238" y="394" width="27" height="22" rx="2" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
              <text x="251" y="388" textAnchor="middle" fill="#34d399" fontSize="8" fontFamily="JetBrains Mono">
                R={results.rcompKohm.nominal}k
              </text>
              <line x1="238" y1="405" x2="210" y2="405" stroke="#34d399" strokeWidth="1.5" />
              {/* C_COMP */}
              <rect x="183" y="394" width="27" height="22" rx="2" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
              <text x="196" y="388" textAnchor="middle" fill="#34d399" fontSize="8" fontFamily="JetBrains Mono">
                C={results.ccompPf.nominal}pF
              </text>
              <line x1="183" y1="405" x2="160" y2="405" stroke="#64748b" strokeWidth="1.5" />
              <line x1="160" y1="397" x2="160" y2="413" stroke="#64748b" strokeWidth="2" />
              <text x="150" y="408" textAnchor="end" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">AGND</text>
            </g>

            {/* Pin 22: VFB Feedback Divider (RFB1, RFB2, C_FF) */}
            <g className="cursor-pointer" onClick={() => handleItemClick('VFB')}>
              <line x1="320" y1="455" x2="240" y2="455" stroke="#c084fc" strokeWidth="1.5" />
              <circle cx="240" cy="455" r="3.5" fill="#c084fc" />

              {/* RFB2 to AGND */}
              <line x1="240" y1="455" x2="240" y2="475" stroke="#c084fc" strokeWidth="1.5" />
              <rect x="228" y="475" width="24" height="26" rx="2" fill="#1e293b" stroke="#c084fc" strokeWidth="1.5" />
              <text x="220" y="490" textAnchor="end" fill="#c084fc" fontSize="8" fontFamily="JetBrains Mono">
                RFB2={results.rfbBottom.formatted}
              </text>
              <line x1="240" y1="501" x2="240" y2="515" stroke="#64748b" strokeWidth="1.5" />
              <line x1="232" y1="515" x2="248" y2="515" stroke="#64748b" strokeWidth="2" />
              <text x="240" y="526" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">AGND</text>

              {/* RFB1 & CFF path to VOUT sense trace */}
              <line x1="240" y1="455" x2="190" y2="455" stroke="#c084fc" strokeWidth="1.5" />
              <circle cx="190" cy="455" r="2.5" fill="#c084fc" />
              
              {/* RFB1 */}
              <rect x="150" y="443" width="28" height="24" rx="2" fill="#1e293b" stroke="#c084fc" strokeWidth="1.5" />
              <text x="164" y="437" textAnchor="middle" fill="#c084fc" fontSize="8" fontFamily="JetBrains Mono">
                RFB1={results.rfbTop.formatted}
              </text>

              {/* C_FF in parallel */}
              <line x1="190" y1="455" x2="190" y2="475" stroke="#c084fc" strokeWidth="1.5" />
              <line x1="190" y1="475" x2="178" y2="475" stroke="#c084fc" strokeWidth="1.5" />
              <rect x="150" y="468" width="28" height="16" rx="2" fill="#1e293b" stroke="#a78bfa" strokeWidth="1" />
              <line x1="150" y1="475" x2="135" y2="475" stroke="#c084fc" strokeWidth="1.5" />
              <line x1="135" y1="475" x2="135" y2="455" stroke="#c084fc" strokeWidth="1.5" />
              <text x="164" y="493" textAnchor="middle" fill="#a78bfa" fontSize="8" fontFamily="JetBrains Mono">
                CFF={results.cffPf?.formatted}
              </text>

              <line x1="150" y1="455" x2="120" y2="455" stroke="#c084fc" strokeWidth="1.5" />
              <circle cx="120" cy="455" r="3" fill="#c084fc" />
            </g>

            {/* Pin 24: R_FSW */}
            <g className="cursor-pointer" onClick={() => handleItemClick('FSW')}>
              <line x1="320" y1="505" x2="265" y2="505" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="238" y="494" width="27" height="22" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="230" y="508" textAnchor="end" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                R_fsw={results.rfswKohm.formatted}
              </text>
              <line x1="238" y1="505" x2="215" y2="505" stroke="#64748b" strokeWidth="1.5" />
              <line x1="215" y1="497" x2="215" y2="513" stroke="#64748b" strokeWidth="2" />
              <text x="205" y="508" textAnchor="end" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">AGND</text>
            </g>

            {/* Pin 25: R_LIM */}
            <g className="cursor-pointer" onClick={() => handleItemClick('ILIMIT')}>
              <line x1="320" y1="545" x2="265" y2="545" stroke="#fbbf24" strokeWidth="1.5" />
              <rect x="238" y="534" width="27" height="22" rx="2" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="230" y="548" textAnchor="end" fill="#fbbf24" fontSize="8" fontFamily="JetBrains Mono">
                R_lim={results.rlimKohm.formatted}
              </text>
              <line x1="238" y1="545" x2="215" y2="545" stroke="#64748b" strokeWidth="1.5" />
              <line x1="215" y1="537" x2="215" y2="553" stroke="#64748b" strokeWidth="2" />
              <text x="205" y="548" textAnchor="end" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">AGND</text>
            </g>

            {/* Pin 27: R_MODE */}
            <g className="cursor-pointer" onClick={() => handleItemClick('MODE')}>
              <line x1="320" y1="575" x2="265" y2="575" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="238" y="564" width="27" height="22" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="230" y="578" textAnchor="end" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                R_mode={results.rmodeKohm.formatted}
              </text>
              <line x1="238" y1="575" x2="215" y2="575" stroke="#64748b" strokeWidth="1.5" />
              <line x1="215" y1="567" x2="215" y2="583" stroke="#64748b" strokeWidth="2" />
              <text x="205" y="578" textAnchor="end" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">AGND</text>
            </g>

            {/* ===================== BOOT & PHASE LOOP (PINS 4, 5, 6) ===================== */}
            <g className="cursor-pointer" onClick={() => handleItemClick('BOOT')}>
              {/* Loop line between BOOT and PHASE1/2 */}
              <path d="M 760 105 L 830 105 L 830 150 L 760 150" fill="none" stroke="#fbbf24" strokeWidth="2" />
              {/* C_boot on top leg */}
              <rect x="775" y="94" width="26" height="22" rx="2" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="788" y="88" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="JetBrains Mono">
                C_boot=100nF
              </text>
              {/* R_boot on bottom leg */}
              <rect x="775" y="139" width="26" height="22" rx="2" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="788" y="172" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="JetBrains Mono">
                R_boot={results.rbootOhm.formatted}
              </text>
            </g>

            {/* ===================== POWER STAGE: SW, L1, COUT, VOUT ===================== */}
            {/* SW node to Inductor */}
            <line x1="700" y1="220" x2="780" y2="220" stroke="#38bdf8" strokeWidth="4.5" />
            <circle cx="760" cy="220" r="4" fill="#38bdf8" />

            {/* Inductor L1 */}
            <g className="cursor-pointer" onClick={() => handleItemClick('L1')}>
              <rect
                x="780"
                y="198"
                width="80"
                height="44"
                rx="5"
                fill={selectedPinOrPart === 'L1' ? '#0369a1' : '#1e293b'}
                stroke="#fbbf24"
                strokeWidth="2.5"
              />
              <path
                d="M 790 220 A 7 7 0 0 1 806 220 A 7 7 0 0 1 822 220 A 7 7 0 0 1 838 220 A 7 7 0 0 1 854 220"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
              />
              <text x="820" y="190" textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="bold">
                Дроссель L1
              </text>
              <text x="820" y="258" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
                {results.lNominal.nominal} µH (Isat ≥ {(results.iPeak * 1.3).toFixed(1)}А)
              </text>
            </g>

            {/* Output Rail: L1 to VOUT */}
            <line x1="860" y1="220" x2="1050" y2="220" stroke="#34d399" strokeWidth="4.5" />
            <circle cx="940" cy="220" r="4" fill="#34d399" />
            
            {/* VOUT Terminal */}
            <circle cx="1050" cy="220" r="5.5" fill="#34d399" />
            <text x="1060" y="212" fill="#34d399" fontSize="14" fontWeight="bold">
              VOUT ({results.voutActual} В)
            </text>
            <text x="1060" y="230" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono">
              Iout = {inputs.ioutMax} А
            </text>

            {/* Output Capacitor Battery (COUT) */}
            <g className="cursor-pointer" onClick={() => handleItemClick('COUT')}>
              <line x1="940" y1="220" x2="940" y2="270" stroke="#34d399" strokeWidth="2" />
              <rect
                x="924"
                y="270"
                width="32"
                height="28"
                rx="3"
                fill={selectedPinOrPart === 'COUT' ? '#065f46' : '#1e293b'}
                stroke="#34d399"
                strokeWidth="2"
              />
              <line x1="930" y1="281" x2="950" y2="281" stroke="#34d399" strokeWidth="2" />
              <line x1="930" y1="287" x2="950" y2="287" stroke="#34d399" strokeWidth="2" />
              <line x1="940" y1="298" x2="940" y2="335" stroke="#64748b" strokeWidth="2" />
              
              {/* PGND Symbol */}
              <line x1="930" y1="335" x2="950" y2="335" stroke="#64748b" strokeWidth="2.5" />
              <line x1="934" y1="339" x2="946" y2="339" stroke="#64748b" strokeWidth="1.5" />
              <line x1="937" y1="343" x2="943" y2="343" stroke="#64748b" strokeWidth="1" />

              <text x="940" y="262" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
                COUT
              </text>
              <text x="940" y="314" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">
                {results.coutQty} × {results.coutSingleUf} µF
              </text>
              <text x="940" y="326" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">
                Пульсации ~{results.actualRippleMv} мВ
              </text>
            </g>

            {/* Pin 16: VDRV Decoupling & Supply */}
            <g className="cursor-pointer" onClick={() => handleItemClick('VDRV')}>
              <line x1="700" y1="380" x2="775" y2="380" stroke="#c084fc" strokeWidth="2" />
              <rect x="775" y="368" width="26" height="24" rx="2" fill="#1e293b" stroke="#c084fc" strokeWidth="1.5" />
              <line x1="788" y1="392" x2="788" y2="415" stroke="#64748b" strokeWidth="1.5" />
              <line x1="780" y1="415" x2="796" y2="415" stroke="#64748b" strokeWidth="2" />
              <text x="788" y="360" textAnchor="middle" fill="#c084fc" fontSize="9" fontWeight="bold">
                C_VDRV
              </text>
              <text x="788" y="430" textAnchor="middle" fill="#c084fc" fontSize="8" fontFamily="JetBrains Mono">
                {results.cvdrvUf.formatted}
              </text>
              {results.detectedMode >= 3 && (
                <text x="815" y="384" textAnchor="start" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono">
                  +5V EXT
                </text>
              )}
            </g>

            {/* Pin 26: VDD Decoupling */}
            <g className="cursor-pointer" onClick={() => handleItemClick('VDD')}>
              <line x1="700" y1="470" x2="775" y2="470" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="775" y="458" width="26" height="24" rx="2" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="788" y1="482" x2="788" y2="505" stroke="#64748b" strokeWidth="1.5" />
              <line x1="780" y1="505" x2="796" y2="505" stroke="#64748b" strokeWidth="2" />
              <text x="788" y="450" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold">
                C_VDD
              </text>
              <text x="788" y="520" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">
                {results.cddUf.formatted}
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Dynamic Pin & Component Inspector Drawer (Page 10 Details) */}
      {activeDetail && (
        <div className="mt-3 p-4 bg-slate-900 border border-cyan-800/60 rounded-lg text-xs space-y-2.5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono font-bold text-xs border border-cyan-800">
                {activeDetail.pin}
              </span>
              <h3 className="font-semibold text-white text-sm">
                {activeDetail.title}
              </h3>
            </div>
            <div className="font-mono text-cyan-300 font-bold bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {activeDetail.value}
            </div>
          </div>

          {activeDetail.formula && (
            <div className="p-2 bg-slate-950/70 border border-slate-800 rounded font-mono text-[11px] text-cyan-300">
              Формула из даташита: <strong className="text-white">{activeDetail.formula}</strong>
            </div>
          )}

          <p className="text-slate-300 text-[11px] leading-relaxed">
            {activeDetail.detail}
          </p>

          {activeDetail.table && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1 pr-3">Режим</th>
                    <th className="py-1 pr-3">Резистор R_MODE</th>
                    <th className="py-1">Поведение микросхемы</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {activeDetail.table.map((row, idx) => (
                    <tr
                      key={idx}
                      className={results.detectedMode === idx + 1 ? 'bg-cyan-950/50 text-cyan-200 font-semibold' : ''}
                    >
                      <td className="py-1 pr-3">{row.mode}</td>
                      <td className="py-1 pr-3 text-cyan-400">{row.res}</td>
                      <td className="py-1">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeDetail.layoutNote && (
            <div className="flex items-start gap-2 p-2 bg-slate-950/90 border border-slate-800 rounded text-[10px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Рекомендация по трассировке платы (PCB Layout):</strong> {activeDetail.layoutNote}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
