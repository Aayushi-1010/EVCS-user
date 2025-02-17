import React, { Fragment, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { router, useLocalSearchParams } from "expo-router";
import EvilIcons from "@expo/vector-icons/EvilIcons";

import DefaultView from "../components/DefaultView";
import { colors } from "../theme/colors";
import Button from "../components/Button";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import PaymentModal from "../components/PaymentModal";
import { retrieveData } from "../services/local";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "../services/config";
import showToast from "../components/ToastMessage";

const WIDTH = Dimensions.get("screen").width;

const generateTimeSlots = (startTime, endTime) => {
  const parseTime = (time) => {
    const [hours, minutes, period] = time.match(/(\d+):(\d+)(am|pm)/).slice(1);
    const hours24 =
      period === "pm" && hours !== "12"
        ? parseInt(hours, 10) + 12
        : parseInt(hours, 10);
    const date = new Date();
    date.setHours(hours24, parseInt(minutes, 10), 0, 0);
    return date;
  };

  const start = parseTime(startTime);
  const end = parseTime(endTime);

  const timeSlots = [];
  let currentTime = new Date(start);

  while (currentTime < end) {
    const nextTime = new Date(currentTime);
    nextTime.setMinutes(currentTime.getMinutes() + 30);

    const formatTime = (date) => {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "pm" : "am";
      hours = hours % 12 || 12; // Convert to 12-hour format
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
      return `${hours}:${minutesStr}${period}`;
    };

    timeSlots.push({
      startTime: formatTime(currentTime),
      endTime: formatTime(nextTime),
    });

    currentTime = nextTime;
  }

  return timeSlots;
};

const SlotBooking = () => {
  const stationDetails = useLocalSearchParams();
  const availablePlugs = stationDetails.plugs.split(",");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectTime] = useState();
  const [selectedPlug, setSelectPlug] = useState();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  const timeSlots = generateTimeSlots(
    stationDetails.openTime,
    stationDetails.closeTime
  );
  const slotsBooked = JSON.parse(stationDetails.slotsBooked);

  const isSlotBooked = (time) => {
    if (slotsBooked.length === 0) {
      return false;
    }
    const result = slotsBooked.find(
      (data) =>
        data.plug == selectedPlug &&
        data.timing === time &&
        selectedDate &&
        data.status !== "cancelled" &&
        new Date(selectedDate).toDateString() ===
          new Date(data.date.seconds * 1000).toDateString()
    );

    return !!result;
  };
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate;
    setSelectedDate(currentDate);
  };

  const selectDate = () => {
    DateTimePickerAndroid.open({
      value: selectedDate || new Date(),
      onChange: onChangeDate,
      mode: "date",
      is24Hour: true,
      minimumDate: new Date(),
    });
  };

  const submitBookingIntoStationCollection = async (data) => {
    const docRef = doc(firestore, "stations", stationDetails.id);
    await updateDoc(docRef, {
      ...stationDetails,
      plugs: availablePlugs,
      stationImage: stationDetails.stationImage.replaceAll("@", "%2F"),
      slotsBooked: [...slotsBooked, data],
      lat: Number(stationDetails.lat),
      lng: Number(stationDetails.lng),
      isBlocked: "false" ? false : true,
    });
  };

  const handleSubmitBooking = async () => {
    try {
      setPaymentModalOpen(true);
      setIsBookingLoading(true);

      const userStringify = await retrieveData("user");

      const userData = JSON.parse(userStringify);

      const docRef = doc(firestore, "users", userData.uid);

      const subCollectionRef = collection(docRef, "booking");

      const subDocRef = doc(subCollectionRef);

      await setDoc(subDocRef, {
        user: userData.uid,
        stationDetails: {
          id: stationDetails.id,
          stationName: stationDetails.stationName,
        },
        timing: selectedTime,
        date: new Date(selectedDate),
        plug: selectedPlug,
        createdAt: new Date(),
        status: "booked",
      });

      await submitBookingIntoStationCollection({
        user: userData.uid,
        timing: selectedTime,
        date: new Date(selectedDate),
        plug: selectedPlug,
        createdAt: new Date(),
        status: "booked",
      });

      setIsBookingLoading(false);
      showToast(
        "success",
        "Booking Slots",
        "Slot has been booked successfully 🥳"
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const onCloseModal = () => {
    setPaymentModalOpen(false);
    setIsBookingLoading(false);
  };

  return (
    <Fragment>
      <PaymentModal
        isOpenModal={isPaymentModalOpen}
        isPaymentLoading={isBookingLoading}
        onCloseModal={onCloseModal}
      />
      <View style={styles.headerContainer}>
        <Pressable
          style={{ padding: 15, borderRadius: 30 }}
          onPress={() => {
            router.back();
          }}
        >
          <AntDesign name="arrowleft" size={22} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{stationDetails.stationName}</Text>
        <View />
      </View>
      <DefaultView style={styles.container}>
        <View style={styles.stationViewContainer}>
          <Text style={styles.commonTitle}>Select Plugs :</Text>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {availablePlugs.map((plug, i) => (
              <Pressable
                onPress={() =>
                  setSelectPlug(selectedPlug === plug ? null : plug)
                }
                key={i}
              >
                <Text
                  key={i}
                  style={[
                    styles.selectOption,
                    {
                      backgroundColor:
                        selectedPlug === plug ? colors.primary : colors.white,
                      color:
                        selectedPlug === plug ? colors.white : colors.primary,
                      elevation: selectedPlug === plug ? 10 : 0,
                    },
                  ]}
                >
                  {plug}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.stationViewContainer}>
          <Text style={styles.commonTitle}>Select Timing :</Text>
          <Pressable
            onPress={selectDate}
            style={[
              styles.selectOption,
              {
                paddingVertical: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              },
            ]}
          >
            <Text
              style={{
                color: selectedDate ? colors.primary : colors.black,
                fontWeight: "bold",
                fontSize: 13,
              }}
            >
              {selectedDate ? new Date(selectedDate).toDateString() : "Select"}
            </Text>
            <EvilIcons
              name="calendar"
              size={24}
              style={{ color: colors.primary, marginTop: -3 }}
            />
          </Pressable>
        </View>
        <View style={[styles.stationViewContainer, { marginBottom: 20 }]}>
          <Text style={styles.commonTitle}>Select Timing :</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 15,
              flexWrap: "wrap",
            }}
          >
            {timeSlots.map(({ startTime, endTime }, i) => {
              const timing = `${startTime} - ${endTime}`;
              const isAlreadyBooked = isSlotBooked(timing);
              return (
                <Pressable
                  onPress={() => {
                    isAlreadyBooked
                      ? showToast("info", "This Slot has been already booked!")
                      : setSelectTime(selectedTime === timing ? null : timing);
                  }}
                  key={i}
                >
                  <Text
                    style={[
                      styles.selectOption,
                      {
                        width: WIDTH * 0.5 - 40,
                        backgroundColor: isAlreadyBooked
                          ? colors.gray
                          : selectedTime === timing
                          ? colors.primary
                          : colors.white,
                        color: isAlreadyBooked
                          ? colors.white
                          : selectedTime === timing
                          ? colors.white
                          : colors.primary,
                        textAlign: "center",
                        paddingVertical: 10,
                        elevation: selectedTime === timing ? 10 : 0,
                        borderColor: isAlreadyBooked
                          ? colors.gray
                          : colors.primary,
                      },
                    ]}
                  >
                    {timing}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </DefaultView>
      <View style={styles.submitButtonContainer}>
        <Button
          title="Book Slot"
          style={{ marginVertical: 10 }}
          disabled={!selectedTime || !selectedPlug || !selectDate}
          onPress={handleSubmitBooking}
        />
      </View>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    paddingTop: 70,
    paddingBottom: 88,
  },
  headerContainer: {
    position: "absolute",
    width: WIDTH,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: 10,
    height: 100,
    width: "100%",
    backgroundColor: colors.primary,
    left: 0,
    zIndex: 10,
    top: 0,
    paddingTop: 40,
    paddingLeft: 10,
  },
  headerTitle: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "bold",
    marginLeft: -30,
  },
  stationViewContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    borderWidth: 1 ,
    borderColor: colors.primary + 80,
    gap: 10,
  },
  commonTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  selectOption: {
    fontWeight: "bold",
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 13,
    borderRadius: 5,
    shadowColor: colors.primary,
    borderWidth: 0.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    color: colors.primary,
  },
  labelText: {
    fontWeight: "800",
  },
  boxRow: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginTop: 10 },
  mapContainer: {
    height: 100,
    width: "100%",
  },
  submitButtonContainer: {
    position: "absolute",
    width: WIDTH,
    bottom: 0,
    left: 0,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 20,
    shadowColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary + 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default SlotBooking;
