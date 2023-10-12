package id.proofme.document.scanner

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import io.didux.reader.source.Utils

class MainActivity : BridgeActivity() {

    val utils = Utils()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        utils.fullScreenTransparent(window)
    }

    override fun onResume() {
        super.onResume()

        utils.resumeFullScreenTransparent(window)
    }
}

