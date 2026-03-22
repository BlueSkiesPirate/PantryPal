import { Text, View } from "react-native";
import { auth } from "../../firebase";

export default function Profile() {
  const user = auth.currentUser;

  return (
    <View>
      <Text>Profile Testing</Text>
      <Text>{user?.email}</Text>
    </View>
  );
}