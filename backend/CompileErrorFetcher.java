import java.io.*;
import java.util.*;

public class CompileErrorFetcher {
    public static void main(String[] args) throws Exception {
        ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", "mvnw.cmd clean compile");
        pb.directory(new File("C:\\Users\\rajai\\OneDrive\\Documents\\Company\\Hack 26\\backend-java"));
        Process p = pb.start();

        BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
        String line;
        List<String> errors = new ArrayList<>();

        while ((line = reader.readLine()) != null) {
            if (line.contains("[ERROR]")) {
                errors.add(line);
            }
        }

        for (int i = 0; i < Math.min(20, errors.size()); i++) {
            System.out.println(errors.get(i));
        }
    }
}
