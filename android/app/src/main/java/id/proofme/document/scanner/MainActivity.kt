package id.proofme.document.scanner

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import io.didux.reader.source.Utils

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Utils.fullScreenTransparent(window)
    }

    override fun onResume() {
        super.onResume()

        Utils.resumeFullScreenTransparent(window)
    }
}

