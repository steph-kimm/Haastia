export const extractProfessional = (payload) => {
  if (!payload) return {};
  if (payload.professional) return payload.professional;
  if (payload.data?.professional) return payload.data.professional;
  return payload;
};

export const normalizeGuidelines = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

export const resolveProfileUrl = (professional) => {
  if (!professional?._id) return "";
  return `/professional/${professional._id}`;
};

export const resolveLastUpdated = (payload = {}, professional = {}) => {
  return (
    professional?.updatedAt ||
    payload?.updatedAt ||
    payload?.profileUpdatedAt ||
    payload?.data?.updatedAt ||
    payload?.data?.profileUpdatedAt ||
    null
  );
};
