import "./global.css";
import { StatusBar } from "expo-status-bar";
import { View, Text } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-900">
      <Text className="text-2xl font-bold text-white">
        Clocktower - Player
      </Text>
      <StatusBar style="light" />
    </View>
  );
}
