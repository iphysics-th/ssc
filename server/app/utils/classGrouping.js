const extractSubjectPayload = (slot = {}) => {
  if (slot.subject && typeof slot.subject === "object") {
    return slot.subject;
  }
  if (slot.name_th) {
    return {
      code: slot.code || null,
      name_th: slot.name_th,
    };
  }
  return null;
};

const extractPrice = (slot = {}) => {
  if (typeof slot.price === "number" && Number.isFinite(slot.price)) {
    return slot.price;
  }
  if (slot.subject && typeof slot.subject === "object") {
    const candidate = Number(slot.subject.price);
    if (Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return null;
};

const groupClassSubjects = (classSubjects = []) => {
  const grouped = new Map();

  classSubjects.forEach((entry, entryIndex) => {
    const classNumber = Number(entry?.classNumber) || entryIndex + 1;
    const slots = Array.isArray(entry?.slots) && entry.slots.length ? entry.slots : [entry];

    slots.forEach((slot, slotIndex) => {
      if (!grouped.has(classNumber)) {
        grouped.set(classNumber, { classNumber, slots: [] });
      }

      const collection = grouped.get(classNumber);
      const subjectPayload = extractSubjectPayload(slot);
      const price = extractPrice(slot);

      collection.slots.push({
        slotIndex: slot.slotIndex ?? slotIndex,
        date: slot.date || null,
        slot: slot.slot || slot.time || null,
        subject: subjectPayload,
        code: subjectPayload?.code || slot.code || null,
        name_th: subjectPayload?.name_th || slot.name_th || null,
        price,
        raw: slot,
      });
    });
  });

  return Array.from(grouped.values())
    .map((entry) => ({
      ...entry,
      slots: entry.slots.sort((a, b) => {
        const aIdx = Number.isFinite(a.slotIndex) ? a.slotIndex : 0;
        const bIdx = Number.isFinite(b.slotIndex) ? b.slotIndex : 0;
        return aIdx - bIdx;
      }),
    }))
    .sort((a, b) => (a.classNumber ?? 0) - (b.classNumber ?? 0));
};

const countUniqueClasses = (classSubjects = []) => groupClassSubjects(classSubjects).length;

module.exports = {
  groupClassSubjects,
  countUniqueClasses,
};
